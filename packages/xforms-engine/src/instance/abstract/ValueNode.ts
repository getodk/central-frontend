import { XPathNodeKindKey } from '@getodk/xpath';
import { createMemo, type Accessor } from 'solid-js';
import type { BaseValueNode } from '../../client/BaseValueNode.ts';
import type { LeafNodeType as ValueNodeType } from '../../client/node-types.ts';
import type { InstanceState } from '../../client/serialization/InstanceState.ts';
import type { ErrorViolation, LeafNodeValidationState } from '../../client/validation.ts';
import type { ValueType } from '../../client/ValueType.ts';
import type { XFormsXPathElement } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { createValueNodeInstanceState } from '../../lib/client-reactivity/instance-state/createValueNodeInstanceState.ts';
import type {
  RuntimeValueSetter,
  RuntimeValueState,
  ValueCodec,
} from '../../lib/codecs/ValueCodec.ts';
import { createInstanceValueState } from '../../lib/reactivity/createInstanceValueState.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import type { SimpleAtomicState } from '../../lib/reactivity/types.ts';
import { LeafNodeDefinition } from '../../parse/model/LeafNodeDefinition.ts';
import type { Attribute } from '../Attribute.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type {
  DecodeInstanceValue,
  InstanceValueContext,
} from '../internal-api/InstanceValueContext.ts';
import type { ClientReactiveSerializableValueNode } from '../internal-api/serialization/ClientReactiveSerializableValueNode.ts';
import type { ValidationContext } from '../internal-api/ValidationContext.ts';
import type { DescendantNodeStateSpec } from './DescendantNode.ts';
import { DescendantNode } from './DescendantNode.ts';
import {
  createValidationState,
  type SharedValidationState,
} from '../../lib/reactivity/validation/createValidation.ts';
import { Failure, Success, type Result } from '../../integration/xpath/EngineXPathEvaluator.ts';

export type ValueNodeDefinition<V extends ValueType> = LeafNodeDefinition<V>;

export interface ValueNodeStateSpec<RuntimeValue> extends DescendantNodeStateSpec<RuntimeValue> {
  readonly children: null;
  readonly attributes: Accessor<readonly Attribute[]>;
  readonly value: SimpleAtomicState<RuntimeValue>;
  readonly instanceValue: Accessor<string>;
}

export abstract class ValueNode<
  V extends ValueType,
  Definition extends ValueNodeDefinition<V>,
  RuntimeValue extends RuntimeInputValue,
  RuntimeInputValue = RuntimeValue,
>
  extends DescendantNode<Definition, ValueNodeStateSpec<RuntimeValue>, GeneralParentNode, null>
  implements
    BaseValueNode<V, RuntimeValue>,
    XFormsXPathElement,
    EvaluationContext,
    InstanceValueContext,
    ValidationContext,
    ClientReactiveSerializableValueNode
{
  protected readonly validation: SharedValidationState;
  protected readonly getInstanceValue: Accessor<string>;
  protected readonly valueState: RuntimeValueState<RuntimeValue>;
  protected readonly setValueState: RuntimeValueSetter<RuntimeInputValue>;

  // XFormsXPathElement
  override readonly [XPathNodeKindKey] = 'element';
  override readonly getXPathValue: () => string;

  // InstanceNode
  protected abstract override readonly state: SharedNodeState<ValueNodeStateSpec<RuntimeValue>>;
  protected abstract override readonly engineState: EngineState<ValueNodeStateSpec<RuntimeValue>>;

  // InstanceValueContext
  readonly decodeInstanceValue: DecodeInstanceValue;

  // BaseValueNode
  abstract override readonly nodeType: ValueNodeType;
  readonly valueType: V;

  abstract override readonly currentState: CurrentState<ValueNodeStateSpec<RuntimeValue>>;

  get validationState(): LeafNodeValidationState {
    return this.validation.currentState;
  }

  readonly instanceState: InstanceState;

  // Write path for `xforms-value-changed` actions targeting this node; permitted while readonly too.
  readonly setEncodedValue: (value: Result<'string'>, bypassReadonly?: boolean) => void;

  constructor(
    parent: GeneralParentNode,
    override readonly instanceNode: StaticLeafElement | null,
    definition: Definition,
    codec: ValueCodec<
      V,
      RuntimeValue,
      RuntimeInputValue,
      ValueNode<V, Definition, RuntimeValue, RuntimeInputValue>
    >
  ) {
    super(parent, instanceNode, definition);

    this.valueType = definition.valueType;
    this.decodeInstanceValue = codec.decodeInstanceValue;

    const { valueState: instanceValueState, setValueFromAction } = createInstanceValueState(this);
    const [getInstanceValueResult, setInstanceValue] = instanceValueState;

    this.getInstanceValue = () => {
      const result = getInstanceValueResult();
      if (result instanceof Success) {
        return (result as Success<'string'>).value;
      }
      return '';
    };
    const valueState = codec.createRuntimeValueState(
      [
        this.getInstanceValue,
        (value: string) => {
          setInstanceValue(new Success<'string'>(value));
          return value;
        },
      ],
      this
    );
    const [, setValueState] = valueState;
    this.setValueState = setValueState;
    this.getXPathValue = () => {
      return this.getInstanceValue();
    };
    this.valueState = valueState;
    this.validation = createValidationState(this, this.instanceConfig);
    this.instanceState = createValueNodeInstanceState(this);

    this.setEncodedValue = (result: Result<'string'>, bypassReadonly = false) => {
      if (result instanceof Success) {
        const decoded = new Success<'string'>(
          this.decodeInstanceValue((result as Success<'string'>).value)
        );
        if (bypassReadonly) {
          setValueFromAction(decoded);
          return;
        }
        setInstanceValue(decoded);
      }
      setInstanceValue(result);
    };

    this.getViolation = this.scope.runTask(() => {
      return createMemo(() => {
        // TODO what order?
        const res = getInstanceValueResult();
        if (res instanceof Failure) {
          return { message: res.error.message, condition: 'error' } as ErrorViolation;
        }
        return this.getBaseViolation();
      });
    });
  }

  // InstanceNode
  getChildren(): readonly [] {
    return [];
  }

  // ValidationContext
  override isBlank(): boolean {
    return this.getInstanceValue() === '';
  }
}
