import { createComputed, createMemo, createSignal, untrack, type Signal } from 'solid-js';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { ValueContext } from '../../instance/internal-api/ValueContext.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
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
	 *   content of the {@link ValueNode.contextNode}. This option
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

const getInitialValue = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	options: ValueStateOptions
): string => {
	const { initialValueSource = 'FORM_DEFAULT' } = options;

	if (initialValueSource === 'FORM_DEFAULT') {
		return context.definition.defaultValue;
	}

	throw new ErrorProductionDesignPendingError('Edit implementation pending');
};

type BaseValueState = Signal<string>;

type RelevantValueState = SimpleAtomicState<string>;

/**
 * Wraps {@link baseValueState} in a signal-like interface which:
 *
 * - produces a blank value for nodes ({@link context}) in a non-relevant state
 * - persists, and restores, the most recent non-blank value state when a
 *   node/context's relevance is restored
 */
const createRelevantValueState = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	baseValueState: BaseValueState
): RelevantValueState => {
	return context.scope.runTask(() => {
		const [getRelevantValue, setValue] = baseValueState;

		const getValue = createMemo(() => {
			if (context.isRelevant()) {
				return getRelevantValue();
			}

			return '';
		});

		return [getValue, setValue];
	});
};

type RuntimeValueState<RuntimeValue> = SimpleAtomicState<RuntimeValue>;

/**
 * Wraps {@link relevantValueState} in a signal-like interface which
 * automatically encodes and decodes a node's runtime value representation:
 *
 * - Values read by a node will be read from the current state as persisted in
 *   the primary instance, then {@link ValueContext.decodeValue | decoded} (as
 *   implemented by that node) into a format suitable for the rest of the
 *   functionality provided by that node.
 *
 * - Values written by a node will be {@link ValueContext.encodeValue | encoded}
 *   (also as implemented by that node) into a string value appropriate for
 *   serialization an instance.
 */
const createRuntimeValueState = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	relevantValueState: RelevantValueState
): RuntimeValueState<RuntimeValue> => {
	const { decodeValue, encodeValue } = context;

	return context.scope.runTask(() => {
		const [primaryInstanceValue, setPrimaryInstanceValue] = relevantValueState;
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
	calculateDefinition: BindComputationExpression<'calculate'>
): void => {
	context.scope.runTask(() => {
		const calculate = createComputedExpression(context, calculateDefinition, {
			defaultValue: '',
		});

		createComputed(() => {
			if (context.isAttached() && context.isRelevant()) {
				const calculated = calculate();
				const value = context.decodeValue(calculated);

				setValue(value);
			}
		});
	});
};

type ValueState<RuntimeValue> = SimpleAtomicState<RuntimeValue>;

/**
 * Provides a consistent interface for value nodes of any type which:
 *
 * - derives initial state from either an existing instance (e.g. for edits) or
 *   the node's definition (e.g. initializing a new instance)
 * - decodes current primary instance state into the value node's runtime type
 * - encodes updated runtime values to store updated instance state
 * - initializes reactive computation of `calculate` bind expressions for those
 *   nodes defined with one
 * - prevents downstream writes to nodes in a readonly state
 */
export const createValueState = <RuntimeValue>(
	context: ValueContext<RuntimeValue>,
	options: ValueStateOptions = {}
): ValueState<RuntimeValue> => {
	return context.scope.runTask(() => {
		const initialValue = getInitialValue(context, options);
		const baseValueState = createSignal(initialValue);
		const valueState = createRelevantValueState(context, baseValueState);
		const runtimeState = createRuntimeValueState(context, valueState);
		const { calculate } = context.definition.bind;

		if (calculate != null) {
			const [, setValue] = runtimeState;

			createCalculation(context, setValue, calculate);
		}

		return guardDownstreamReadonlyWrites(context, runtimeState);
	});
};
