import type { Signal } from 'solid-js';
import { createComputed, createMemo, createSignal, untrack } from 'solid-js';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from './types.ts';

type InitialValueSource = 'FORM_DEFAULT' | 'PRIMARY_INSTANCE';

export interface InstanceValueStateOptions {
	/**
	 * Specifies the source of a {@link createInstanceValueState} signal's initial
	 * value state, where:
	 *
	 * - 'FORM_DEFAULT': Derives the initial state from the form's definition of
	 *   the node itself. This is the default option, appropriate when
	 *   initializing a form without additional primary instance data. In other
	 *   words, this value should not be used for edits.
	 *
	 * - 'PRIMARY_INSTANCE': Derives the initial state from the current text
	 *   content of the {@link ValueNode.contextNode}. This option should be
	 *   specified when initializing a form with existing primary instance data,
	 *   such as when editing a previous submission.
	 *
	 * @default 'FORM_DEFAULT'
	 *
	 * Specifies whether a {@link createInstanceValueState} signal's initial state
	 * should be derived from the current text content of the
	 * {@link ValueNode.contextNode | primary instance DOM state}.
	 */
	readonly initialValueSource?: InitialValueSource;
}

const getInitialValue = (
	context: InstanceValueContext,
	options: InstanceValueStateOptions
): string => {
	const { initialValueSource = 'FORM_DEFAULT' } = options;

	if (initialValueSource === 'FORM_DEFAULT') {
		const { defaultValue } = context.definition;

		return context.decodeInstanceValue(defaultValue);
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
const createRelevantValueState = (
	context: InstanceValueContext,
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

/**
 * For fields with a `readonly` bind expression, prevent downstream
 * (client/user) writes when the field is in a `readonly` state.
 */
const guardDownstreamReadonlyWrites = (
	context: InstanceValueContext,
	baseState: SimpleAtomicState<string>
): SimpleAtomicState<string> => {
	const { readonly } = context.definition.bind;

	if (readonly.isDefaultExpression) {
		return baseState;
	}

	const [getValue, baseSetValue] = baseState;

	const setValue: SimpleAtomicStateSetter<string> = (value) => {
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
const createCalculation = (
	context: InstanceValueContext,
	setRelevantValue: SimpleAtomicStateSetter<string>,
	calculateDefinition: BindComputationExpression<'calculate'>
): void => {
	context.scope.runTask(() => {
		const calculate = createComputedExpression(context, calculateDefinition, {
			defaultValue: '',
		});

		createComputed(() => {
			if (context.isAttached() && context.isRelevant()) {
				const calculated = calculate();
				const value = context.decodeInstanceValue(calculated);

				setRelevantValue(value);
			}
		});
	});
};

export type InstanceValueState = SimpleAtomicState<string>;

/**
 * Provides a consistent interface for value nodes of any type which:
 *
 * - derives initial state from either an existing instance (e.g. for edits) or
 *   the node's definition (e.g. initializing a new submission)
 * - decodes current primary instance state into the value node's runtime type
 * - encodes updated runtime values to store updated instance state
 * - initializes reactive computation of `calculate` bind expressions for those
 *   nodes defined with one
 * - prevents downstream writes to nodes in a readonly state
 */
export const createInstanceValueState = (
	context: InstanceValueContext,
	options: InstanceValueStateOptions = {}
): InstanceValueState => {
	return context.scope.runTask(() => {
		const initialValue = getInitialValue(context, options);
		const baseValueState = createSignal(initialValue);
		const relevantValueState = createRelevantValueState(context, baseValueState);
		const { calculate } = context.definition.bind;

		if (calculate != null) {
			const [, setValue] = relevantValueState;

			createCalculation(context, setValue, calculate);
		}

		return guardDownstreamReadonlyWrites(context, relevantValueState);
	});
};
