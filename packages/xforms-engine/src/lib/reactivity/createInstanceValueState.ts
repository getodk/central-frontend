import type { Signal } from 'solid-js';
import { createComputed, createMemo, createSignal, untrack } from 'solid-js';
import type { AttributeContext } from '../../instance/internal-api/AttributeContext.ts';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import { ActionComputationExpression } from '../../parse/expression/ActionComputationExpression.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import { ActionDefinition } from '../../parse/model/ActionDefinition.ts';
import type { AnyBindPreloadDefinition } from '../../parse/model/BindPreloadDefinition.ts';
import { XFORM_EVENT } from '../../parse/model/Event.ts';
import { SET_GEOPOINT_LOCAL_NAME } from '../../parse/XFormDOM.ts';
import { sharedValueCodecs } from '../codecs/getSharedValueCodec.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from './types.ts';

const REPEAT_INDEX_REGEX = /([^[]*)(\[[0-9]+\])/g;

type ValueContext = AttributeContext | InstanceValueContext;

const isInstanceFirstLoad = (context: ValueContext) => {
	return context.rootDocument.initializationMode === 'create' && !isAddingRepeatChild(context);
};

const isAddingRepeatChild = (context: ValueContext) => {
	return context.rootDocument.isAttached();
};

/**
 * Special case, does not correspond to any event.
 */
const isEditInitialLoad = (context: ValueContext) => {
	return context.rootDocument.initializationMode === 'edit' && !isAddingRepeatChild(context);
};

const getInitialValue = (context: ValueContext): string => {
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
	context: ValueContext,
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
	context: ValueContext,
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

const setValueIfPreloadDefined = (
	context: ValueContext,
	setValue: SimpleAtomicStateSetter<string>,
	preload: AnyBindPreloadDefinition
) => {
	const value = preload.getValue(context);
	if (value) {
		setValue(value);
	}
};

const postloadValue = (
	context: ValueContext,
	setValue: SimpleAtomicStateSetter<string>,
	preload: AnyBindPreloadDefinition
) => {
	const ref = context.contextReference();
	context.definition.model.registerXformsRevalidateListener(ref, () => {
		setValueIfPreloadDefined(context, setValue, preload);
	});
};

const preloadValue = (context: ValueContext, setValue: SimpleAtomicStateSetter<string>): void => {
	const { preload } = context.definition.bind;
	if (!preload) {
		return;
	}

	if (preload.event === XFORM_EVENT.xformsRevalidate) {
		postloadValue(context, setValue, preload);
	} else if (preload.event === XFORM_EVENT.odkInstanceFirstLoad) {
		if (isInstanceFirstLoad(context)) {
			setValueIfPreloadDefined(context, setValue, preload);
		}
	} else if (preload.event === XFORM_EVENT.odkInstanceLoad) {
		if (isInstanceFirstLoad(context) || isEditInitialLoad(context)) {
			setValueIfPreloadDefined(context, setValue, preload);
		}
	}
};

const referencesCurrentNode = (context: ValueContext, ref: string): boolean => {
	const nodes = context.evaluator.evaluateNodes(ref, {
		contextNode: context.contextNode,
	});
	if (nodes.length > 1) {
		throw new Error(
			'You are trying to target a repeated field. Currently you may only target a field in a specific repeat instance. XPath nodeset has more than one node.'
		);
	}
	return nodes.includes(context.contextNode);
};

// Replaces the unbound repeat references in source and ref, with references
// bound to the repeat instace of the context.
const bindToRepeatInstance = (
	context: ValueContext,
	action: ActionDefinition
): { source: string | undefined; ref: string } => {
	let source = action.source;
	let ref = action.ref;
	if (source) {
		const contextRef = context.contextReference();
		for (const part of contextRef.matchAll(REPEAT_INDEX_REGEX)) {
			const unbound = part[1] + '/';
			if (source.includes(unbound)) {
				const bound = part[0] + '/';
				source = source.replace(unbound, bound);
				ref = ref.replace(unbound, bound);
			}
		}
	}
	return { source, ref };
};

/**
 * Defines a reactive effect which writes the result of `calculate` bind
 * computations to the provided value setter, on initialization and any
 * subsequent reactive update.
 *
 * @see {@link preloadValue} for important details about spec ordering of
 * events and computations.
 */
const createCalculation = (
	context: ValueContext,
	setRelevantValue: SimpleAtomicStateSetter<string>,
	computation: ActionComputationExpression<'string'> | BindComputationExpression<'calculate'>
): void => {
	const calculate = createComputedExpression(context, computation);
	createComputed(() => {
		if (context.isAttached() && context.isRelevant()) {
			const calculated = calculate();
			const value = context.decodeInstanceValue(calculated);
			setRelevantValue(value);
		}
	});
};

/**
 * Runs the computation without maintaining a reactive listener, so
 * actions that should run only at a specific time are not triggered
 * when referenced elements are updated.
 */
const createActionCalculation = (
	context: ValueContext,
	setRelevantValue: SimpleAtomicStateSetter<string>,
	computation: ActionComputationExpression<'string'>
): void => {
	createComputed(() => {
		if (context.isAttached()) {
			// use untrack so the expression evaluation isn't reactive
			const relevant = untrack(() => context.isRelevant());
			if (!relevant) {
				return;
			}
			const calculated = untrack(() => {
				return context.evaluator.evaluateString(computation.expression, context);
			});
			const value = context.decodeInstanceValue(calculated);
			setRelevantValue(value);
		}
	});
};

const resolveAndSetValueChanged = (
	context: ValueContext,
	setRelevantValue: SimpleAtomicStateSetter<string>,
	expression: string
): void => {
	const calc = context.evaluator.evaluateString(expression, context);
	const value = context.decodeInstanceValue(calc);
	setRelevantValue(value);
};

const createValueChangedCalculation = (
	context: ValueContext,
	setRelevantValue: SimpleAtomicStateSetter<string>,
	action: ActionDefinition
): void => {
	const { source, ref } = bindToRepeatInstance(context, action);
	if (!source) {
		// No element to listen to
		return;
	}
	let previous: string;
	const sourceElementExpression = new ActionComputationExpression('string', source);
	const calculateValueSource = createComputedExpression(context, sourceElementExpression); // Registers listener
	createComputed(() => {
		if (context.isAttached() && context.isRelevant()) {
			const valueSource = calculateValueSource();
			if (
				previous !== undefined &&
				previous !== valueSource &&
				referencesCurrentNode(context, ref)
			) {
				// Only update if value has changed
				if (action.element.nodeName === SET_GEOPOINT_LOCAL_NAME) {
					getGeopointValue(context, (point) => {
						setRelevantValue(point);
					});
				} else {
					resolveAndSetValueChanged(context, setRelevantValue, action.computation.expression);
				}
			}
			previous = valueSource;
		}
	});
};

const getGeopointValue = (context: ValueContext, callback: (value: string) => void) => {
	// eslint-disable-next-line @typescript-eslint/no-floating-promises -- we don't want to block
	context.rootDocument.getBackgroundGeopoint()?.then((point) => {
		// Allow the codec to manage all geolocation validation.
		// It decodes and encodes the value, and setValue expects a string.
		callback(sharedValueCodecs.geopoint.encodeValue(point));
	});
};

const performActionComputation = (
	context: ValueContext,
	setValue: SimpleAtomicStateSetter<string>,
	action: ActionDefinition
) => {
	if (action.element.nodeName === SET_GEOPOINT_LOCAL_NAME) {
		getGeopointValue(context, (point) => setValue(point));
		return;
	}
	createActionCalculation(context, setValue, action.computation);
};

const dispatchAction = (
	context: ValueContext,
	setValue: SimpleAtomicStateSetter<string>,
	action: ActionDefinition
) => {
	if (action.events.includes(XFORM_EVENT.odkInstanceFirstLoad)) {
		if (isInstanceFirstLoad(context)) {
			performActionComputation(context, setValue, action);
		}
	}
	if (action.events.includes(XFORM_EVENT.odkInstanceLoad)) {
		if (!isAddingRepeatChild(context)) {
			performActionComputation(context, setValue, action);
		}
	}
	if (action.events.includes(XFORM_EVENT.odkNewRepeat)) {
		if (isAddingRepeatChild(context)) {
			performActionComputation(context, setValue, action);
		}
	}
	if (action.events.includes(XFORM_EVENT.xformsValueChanged)) {
		createValueChangedCalculation(context, setValue, action);
	}
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
export const createInstanceValueState = (context: ValueContext): InstanceValueState => {
	return context.scope.runTask(() => {
		const initialValue = getInitialValue(context);
		const baseValueState = createSignal(initialValue);
		const relevantValueState = createRelevantValueState(context, baseValueState);

		const [, setValue] = relevantValueState;

		preloadValue(context, setValue);

		const { calculate } = context.definition.bind;
		if (calculate != null) {
			createCalculation(context, setValue, calculate);
		}

		const action = context.definition.model.actions.get(context.contextReference());
		if (action) {
			dispatchAction(context, setValue, action);
		}

		return guardDownstreamReadonlyWrites(context, relevantValueState);
	});
};
