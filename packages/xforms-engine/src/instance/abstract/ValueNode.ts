import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { BaseValueNode } from '../../client/BaseValueNode.ts';
import type { LeafNodeType as ValueNodeType } from '../../client/node-types.ts';
import type { InstanceState } from '../../client/serialization/InstanceState.ts';
import type { AnyViolation, LeafNodeValidationState } from '../../client/validation.ts';
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
import type { SharedValidationState } from '../../lib/reactivity/validation/createValidation.ts';
import { createValidationState } from '../../lib/reactivity/validation/createValidation.ts';
import { LeafNodeDefinition } from '../../parse/model/LeafNodeDefinition.ts';
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

export type ValueNodeDefinition<V extends ValueType> = LeafNodeDefinition<V>;

export interface ValueNodeStateSpec<RuntimeValue> extends DescendantNodeStateSpec<RuntimeValue> {
	readonly children: null;
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

	constructor(
		parent: GeneralParentNode,
		override readonly instanceNode: StaticLeafElement | null,
		definition: Definition,
		codec: ValueCodec<V, RuntimeValue, RuntimeInputValue>
	) {
		super(parent, instanceNode, definition);

		this.valueType = definition.valueType;
		this.decodeInstanceValue = codec.decodeInstanceValue;

		const instanceValueState = createInstanceValueState(this);
		const valueState = codec.createRuntimeValueState(instanceValueState);

		const [getInstanceValue] = instanceValueState;
		const [, setValueState] = valueState;

		this.getInstanceValue = getInstanceValue;
		this.setValueState = setValueState;
		this.getXPathValue = () => {
			return this.getInstanceValue();
		};
		this.valueState = valueState;
		this.validation = createValidationState(this, this.instanceConfig);
		this.instanceState = createValueNodeInstanceState(this);
	}

	// ValidationContext
	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	isBlank(): boolean {
		return this.getInstanceValue() === '';
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}
}
