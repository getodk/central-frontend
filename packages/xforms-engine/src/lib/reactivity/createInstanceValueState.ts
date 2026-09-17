import type { Accessor, Signal } from 'solid-js';
import { createComputed, createMemo, createSignal, onCleanup, untrack } from 'solid-js';
import type { AttributeContext } from '../../instance/internal-api/AttributeContext.ts';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import { ActionComputationExpression } from '../../parse/expression/ActionComputationExpression.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import { ActionDefinition } from '../../parse/model/ActionDefinition.ts';
import type { AnyBindPreloadDefinition } from '../../parse/model/BindPreloadDefinition.ts';
import { XFORM_EVENT } from '../../parse/model/Event.ts';
import { sharedValueCodecs } from '../codecs/getSharedValueCodec.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from './types.ts';
import { ValueNode } from '../../instance/abstract/ValueNode.ts';
import { Attribute } from '../../instance/Attribute.ts';
import type { AnyValueNode } from '../../instance/hierarchy.ts';
import { getInstanceDefaultValue } from '../instance-defaults.ts';
import type { Result } from '../../integration/xpath/EngineXPathEvaluator.ts';

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
  const value =
    getInstanceDefaultValue(context.instanceConfig.instanceDefaults, context) ??
    context.instanceNode?.value ??
    context.definition.template?.value;
  return context.decodeInstanceValue(value);
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
 * Rejects downstream (client/user) writes while the field is in a `readonly` state.
 * Engine writes (`calculate` computations, preloads, `setvalue` actions) never pass through this guard.
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

      throw new Error(`Cannot write to readonly field: ${reference}`); // TODO use setError here?
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
  const { model } = context.definition;

  model.registerXformsRevalidateListener(context, () => {
    setValueIfPreloadDefined(context, setValue, preload);
  });

  onCleanup(() => {
    model.unregisterXformsRevalidateListener(context);
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
  if (!nodes.success) {
    context.setError(nodes.error);
    return false;
  }
  context.setError(null);
  if (nodes.value.length > 1) {
    // TODO setError instead of throwing
    throw new Error(
      'You are trying to target a repeated field. Currently you may only target a field in a specific repeat instance. XPath nodeset has more than one node.'
    );
  }
  return nodes.value.includes(context.contextNode);
};

// Replaces the unbound repeat references in source and ref, with references
// bound to the repeat instance of the context.
const bindRefToRepeatInstance = (context: ValueContext, ref: string): string => {
  const contextRef = context.contextReference();
  for (const part of contextRef.matchAll(REPEAT_INDEX_REGEX)) {
    const unbound = part[1] + '/';
    const bound = part[0] + '/';
    if (ref.includes(unbound)) {
      ref = ref.replace(unbound, bound);
    }
  }
  return ref;
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
      if (calculated.success) {
        const value = context.decodeInstanceValue(calculated.value);
        context.setError(null);
        setRelevantValue(value);
      } else {
        context.setError(calculated.error);
      }
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
      if (calculated.success) {
        const value = context.decodeInstanceValue(calculated.value);
        context.setError(null);
        setRelevantValue(value);
      } else {
        context.setError(calculated.error);
      }
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
  if (action.type === 'geopoint') {
    getGeopointValue(context, (point) => setValue(point));
    return;
  }
  createActionCalculation(context, setValue, action.computation);
};

const registerSetValueActions = (
  context: ValueContext,
  setValue: SimpleAtomicStateSetter<string>
) => {
  const actions = context.definition.model.actions.get(context.contextReference());
  actions?.forEach((action) => {
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
  });
};

const isValueChangedActionTarget = (node: unknown): node is AnyValueNode | Attribute => {
  return node instanceof ValueNode || node instanceof Attribute;
};

const registerValueChangedActions = (context: ValueContext, getValue: Accessor<string>) => {
  if (!context.valueChangedActions?.length) {
    return;
  }
  let previous: string;
  createComputed(() => {
    const sourceValue = getValue();
    context.valueChangedActions.forEach((action) => {
      const ref = bindRefToRepeatInstance(context, action.ref);
      const nodesResult = context.evaluator.evaluateNodes(ref, {
        contextNode: context.contextNode,
      });
      if (!nodesResult.success) {
        context.setError(nodesResult.error);
        return;
      }
      context.setError(null);

      if (!nodesResult.value.length) {
        return;
      }
      const destinationNode = nodesResult.value[0];
      if (
        isValueChangedActionTarget(destinationNode) &&
        destinationNode.isAttached() &&
        context.isAttached()
      ) {
        if (
          previous !== undefined &&
          previous !== sourceValue &&
          referencesCurrentNode(destinationNode, ref)
        ) {
          if (action.type === 'geopoint') {
            getGeopointValue(context, (point) => destinationNode.setEncodedValue(point, true));
          } else {
            const valueResult: Result<'string'> = untrack(() => {
              return context.evaluator.evaluateString(
                action.computation.expression,
                destinationNode
              );
            });
            if (valueResult.success) {
              destinationNode.setError(null);
              destinationNode.setEncodedValue(valueResult.value, true);
            } else {
              destinationNode.setError(valueResult.error);
            }
          }
        }
      }
    });
    previous = sourceValue;
  });
};

export interface InstanceValueState {
  // The node's instance value. The setter rejects client writes while readonly.
  readonly valueState: SimpleAtomicState<string>;
  // Unguarded setter for the same value, used by `xforms-value-changed` actions writing to this node.
  readonly setValueFromAction: SimpleAtomicStateSetter<string>;
}

/**
 * Provides a consistent interface for value nodes of any type which:
 *
 * - derives initial state from either an existing instance (e.g. for edits) or
 *   the node's definition (e.g. initializing a new instance)
 * - decodes current primary instance state into the value node's runtime type
 * - encodes updated runtime values to store updated instance state
 * - initializes reactive computation of `calculate` bind expressions for those
 *   nodes defined with one
 * - prevents downstream (client/user) writes to nodes in a readonly state,
 *   while still permitting engine-initiated writes to those nodes
 */
export const createInstanceValueState = (context: ValueContext): InstanceValueState => {
  return context.scope.runTask(() => {
    const initialValue = getInitialValue(context);
    const baseValueState = createSignal(initialValue);
    const relevantValueState = createRelevantValueState(context, baseValueState);

    const [getValue, setValue] = relevantValueState;

    preloadValue(context, setValue);

    const { calculate } = context.definition.bind;
    if (calculate != null) {
      createCalculation(context, setValue, calculate);
    }

    registerValueChangedActions(context, getValue);
    registerSetValueActions(context, setValue);

    return {
      valueState: guardDownstreamReadonlyWrites(context, relevantValueState),
      setValueFromAction: setValue,
    };
  });
};
