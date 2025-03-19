import type { Signal } from 'solid-js';
import { createComputed, createMemo, createSignal, untrack } from 'solid-js';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from './types.ts';

const isInstanceFirstLoad = (context: InstanceValueContext) => {
	return context.rootDocument.initializationMode === 'create';
};

/**
 * Special case, does not correspond to any event.
 *
 * @see {@link shouldPreloadUID}
 */
const isEditInitialLoad = (context: InstanceValueContext) => {
	return context.rootDocument.initializationMode === 'edit';
};

const getInitialValue = (context: InstanceValueContext): string => {
	const sourceNode = context.instanceNode ?? context.definition.template;

	return context.decodeInstanceValue(sourceNode.value);
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
 * Per {@link https://getodk.github.io/xforms-spec/#preload-attributes:~:text=concatenation%20of%20%E2%80%98uuid%3A%E2%80%99%20and%20uuid()}
 */
const PRELOAD_UID_EXPRESSION = 'concat("uuid:", uuid())';

/**
 * @todo It feels increasingly awkward to keep piling up preload stuff here, but it won't stay that way for long. In the meantime, this seems like the best way to express the cases where `preload="uid"` should be effective, i.e.:
 *
 * - When an instance is first loaded ({@link isInstanceFirstLoad})
 * - When an instance is initially loaded for editing ({@link isEditInitialLoad})
 */
const shouldPreloadUID = (context: InstanceValueContext) => {
	return isInstanceFirstLoad(context) || isEditInitialLoad(context);
};

/**
 * @todo This is a temporary one-off, until we support the full range of
 * {@link https://getodk.github.io/xforms-spec/#preload-attributes | preloads}.
 *
 * @todo ALSO, IMPORTANTLY(!): the **call site** for this function is
 * semantically where we would expect to trigger a
 * {@link https://getodk.github.io/xforms-spec/#event:odk-instance-first-load | odk-instance-first-load event},
 * _and compute_ preloads semantically associated with that event.
 */
const setPreloadUIDValue = (
	context: InstanceValueContext,
	valueState: RelevantValueState
): void => {
	const { preload } = context.definition.bind;

	if (preload?.type !== 'uid' || !shouldPreloadUID(context)) {
		return;
	}

	const preloadUIDValue = context.evaluator.evaluateString(PRELOAD_UID_EXPRESSION, {
		contextNode: context.contextNode,
	});

	const [, setValue] = valueState;

	setValue(preloadUIDValue);
};

/**
 * Defines a reactive effect which writes the result of `calculate` bind
 * computations to the provided value setter, on initialization and any
 * subsequent reactive update.
 *
 * @see {@link setPreloadUIDValue} for important details about spec ordering of
 * events and computations.
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
 *   the node's definition (e.g. initializing a new instance)
 * - decodes current primary instance state into the value node's runtime type
 * - encodes updated runtime values to store updated instance state
 * - initializes reactive computation of `calculate` bind expressions for those
 *   nodes defined with one
 * - prevents downstream writes to nodes in a readonly state
 */
export const createInstanceValueState = (context: InstanceValueContext): InstanceValueState => {
	return context.scope.runTask(() => {
		const initialValue = getInitialValue(context);
		const baseValueState = createSignal(initialValue);
		const relevantValueState = createRelevantValueState(context, baseValueState);

		/**
		 * @see {@link setPreloadUIDValue} for important details about spec ordering of events and computations.
		 */
		setPreloadUIDValue(context, relevantValueState);

		const { calculate } = context.definition.bind;

		if (calculate != null) {
			const [, setValue] = relevantValueState;

			createCalculation(context, setValue, calculate);
		}

		return guardDownstreamReadonlyWrites(context, relevantValueState);
	});
};
