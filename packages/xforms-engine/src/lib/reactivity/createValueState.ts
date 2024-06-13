import { createComputed, createMemo, createSignal, untrack } from 'solid-js';
import type { DependentExpression } from '../../expression/DependentExpression.ts';
import type { SubscribableDependency } from '../../instance/internal-api/SubscribableDependency.ts';
import type { ValueContext } from '../../instance/internal-api/ValueContext.ts';
import type { BindComputation } from '../../model/BindComputation.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from './types.ts';

type InitialValueSource = 'FORM_DEFAULT' | 'PRIMARY_INSTANCE';

export interface ValueStateOptions {
	/**
	 * Specifies the source of a {@link createValueState} signal's initial
	 * value state, where:
	 *
	 * - 'FORM_DEFAULT': Derives the initial state from the form's
	 *   definition of the node itself. This is the default option, appropriate
	 *   when initializing a form without additional primary instance data. In
	 *   other words, this value should not be used for edits.
	 *
	 * - 'PRIMARY_INSTANCE': Derives the initial state from the current text
	 *   content of the {@link ValueNode.contextNode} (currently an XML DOM
	 *   backing store/source of thruth for primary instance state). This option
	 *   should be specified when initializing a form with existing primary
	 *   instance data, such as when editing a previous submission.
	 *
	 * @default 'FORM_DEFAULT'
	 *
	 * Specifies whether a {@link createV} signal's initial state
	 * should be derived from the current text content of the
	 * {@link ValueNode.contextNode | primary instance DOM state}.
	 */
	readonly initialValueSource?: InitialValueSource;
}

interface PersistedValueState {
	readonly isRelevant: boolean;
	readonly value: string;
}

type PrimaryInstanceValueState = SimpleAtomicState<string>;

type ValueState<RuntimeValue> = SimpleAtomicState<RuntimeValue>;

/**
 * Creates a signal which:
 *
 * 1. Persists its state to the primary instance's
 *    {@link ValueContext.contextNode | contextNode} on state changes.
 * 2. Propagates downstream reactivity only after that write is persisted.
 *
 * This ensures that reactive subscriptions get a consistent view of a node's
 * current state, regardless of whether they derive state from values in the
 * primary instance (currently: computed {@link DependentExpression}
 * evaluations) or from other aspects of reactive runtime state (generally,
 * everything besides computed {@link DependentExpression}s).
 */
const createPrimaryInstanceValueState = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	options: ValueStateOptions
): PrimaryInstanceValueState => {
	const { contextNode, definition, scope } = context;
	const { initialValueSource } = options;
	const { defaultValue } = definition;

	return scope.runTask(() => {
		// prettier-ignore
		const initialValue =
			initialValueSource === 'PRIMARY_INSTANCE'
				? contextNode.textContent ?? defaultValue
				: defaultValue;

		const persistedValueState = createSignal<PersistedValueState>(
			{
				isRelevant: context.isRelevant(),
				value: initialValue,
			},
			{
				// This could return a single boolean expression, but checking each
				// equality condition separately feels like it more clearly expresses
				// the intent.
				equals: (previous, updated) => {
					if (updated.isRelevant !== previous.isRelevant) {
						return false;
					}

					return updated.value === previous.value;
				},
			}
		);
		const [persistedValue, setValueForPersistence] = persistedValueState;

		createComputed(() => {
			const isRelevant = context.isRelevant();

			setValueForPersistence((persisted) => {
				return {
					isRelevant,
					value: persisted.value,
				};
			});
		});

		const toSignalValue = (current: PersistedValueState): string => {
			if (current.isRelevant) {
				return current.value;
			}

			return '';
		};

		const [signalValue, setSignalValue] = createSignal(toSignalValue(persistedValue()));

		createComputed(() => {
			const { isRelevant, value } = persistedValue();
			const preparedTextContent = isRelevant ? value : '';
			const assignedTextContent = (contextNode.textContent = preparedTextContent);

			setSignalValue(assignedTextContent);
		});

		const setPrimaryInstanceValue: SimpleAtomicStateSetter<string> = (value) => {
			// TODO: Check (error?) for non-relevant value change?
			const persisted = setValueForPersistence({
				isRelevant: context.isRelevant(),
				value,
			});

			return persisted.value;
		};

		return [signalValue, setPrimaryInstanceValue];
	});
};

/**
 * Wraps a node's {@link PrimaryInstanceValueState} in a signal-like interface
 * which automatically encodes and decodes a node's runtime value
 * representation:
 *
 * - Values read by a node will be read from the current state as persisted in
 *   the primary instance, then {@link ValueContext.decodeValue | decoded} (as
 *   implemented by that node) into a format suitable for the rest of the
 *   functionality provided by that node.
 *
 * - Values written by a node will be {@link ValueContext.encodeValue | encoded}
 *   (also as implemented by that node) into a string appropriate to persist to
 *   the primary instance, and written to it as such.
 *
 * - Downstream reactive computations should subscribe to updates to this
 *   runtime state (suggesting the value node itself should access this state in
 *   its {@link SubscribableDependency.subscribe} implementation).
 */
const createRuntimeValueState = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	primaryInstanceState: PrimaryInstanceValueState
): ValueState<RuntimeValue> => {
	const { decodeValue, encodeValue } = context;

	return context.scope.runTask(() => {
		const [primaryInstanceValue, setPrimaryInstanceValue] = primaryInstanceState;
		const getRuntimeValue = createMemo(() => {
			return decodeValue(primaryInstanceValue());
		});
		const setRuntimeValue: SimpleAtomicStateSetter<RuntimeValue> = (value) => {
			const encodedValue = encodeValue(value);

			return decodeValue(setPrimaryInstanceValue(encodedValue));
		};

		return [getRuntimeValue, setRuntimeValue];
	});
};

/**
 * For fields with a `readonly` bind expression, prevent downstream
 * (client/user) writes when the field is in a `readonly` state.
 */
const guardDownstreamReadonlyWrites = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	baseState: SimpleAtomicState<RuntimeValue>
): SimpleAtomicState<RuntimeValue> => {
	const { readonly } = context.definition.bind;

	if (readonly.isDefaultExpression) {
		return baseState;
	}

	const [getValue, baseSetValue] = baseState;

	const setValue: SimpleAtomicStateSetter<RuntimeValue> = (value) => {
		if (context.isReadonly()) {
			const reference = untrack(() => context.contextReference());

			throw new Error(`Cannot write to readonly field: ${reference}`);
		}

		return baseSetValue(value);
	};

	return [getValue, setValue];
};

/**
 * Defines a reactive effect which writes the result of `calculate` bind
 * computations to the provided value setter, on initialization and any
 * subsequent reactive update.
 */
const createCalculation = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	setValue: SimpleAtomicStateSetter<RuntimeValue>,
	calculateDefinition: BindComputation<'calculate'>
): void => {
	context.scope.runTask(() => {
		const calculate = createComputedExpression(context, calculateDefinition);

		createComputed(() => {
			if (context.isRelevant()) {
				const calculated = calculate();
				const value = context.decodeValue(calculated);

				setValue(value);
			}
		});
	});
};

/**
 * Provides a consistent interface for value nodes of any type which:
 *
 * - derives initial state from either the existing primary instance state (e.g.
 *   for edits) or the node's definition (e.g. initializing a new submission)
 * - decodes primary instance state into the value node's runtime type
 * - encodes and persists updated values to the primary instance
 * - initializes reactive computation of `calculate` bind expressions for those
 *   nodes defined with one
 * - ensures any downstream reactive dependencies are updated only after writes
 *   (whether performed by a client, or by a reactive `calculate` computation)
 *   are persisted, ensuring a consistent view of state when downstream
 *   computations perform XPath evaluations against that primary instance state
 */
export const createValueState = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	options: ValueStateOptions = {}
): ValueState<RuntimeValue> => {
	const primaryInstanceState = createPrimaryInstanceValueState(context, options);
	const runtimeState = createRuntimeValueState(context, primaryInstanceState);

	const { calculate } = context.definition.bind;

	if (calculate != null) {
		const [, setValue] = runtimeState;

		createCalculation(context, setValue, calculate);
	}

	return guardDownstreamReadonlyWrites(context, runtimeState);
};
