import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeType } from './node-types.ts';
import type { InstanceState } from './serialization/InstanceState.ts';
import type { LeafNodeValidationState } from './validation.ts';
import type { ValueType } from './ValueType.ts';

export interface BaseValueNodeState<Value> extends BaseNodeState {
	get children(): null;
	get valueOptions(): unknown;
	get value(): Value;

	/**
	 * Reflects the serialized string representation of a {@link BaseValueNode}'s
	 * {@link value} state. This representation allows access to the node's value
	 * _as primary instance state_. In other words, this is the value which:
	 *
	 * - would be serialized as a text node in {@link InstanceState.instanceXML}
	 *   (note: this value is **NOT** escaped for XML serialization, as it is
	 *   there)
	 *
	 * - is used when the node's value is referenced in any of a form's XPath
	 *   expressions
	 *
	 * @todo Consider moving into {@link InstanceState}
	 */
	get instanceValue(): string;
}

export interface BaseValueNode<V extends ValueType = ValueType, Value = string> extends BaseNode {
	readonly nodeType: LeafNodeType;
	readonly valueType: V;
	readonly definition: LeafNodeDefinition;
	readonly parent: GeneralParentNode;
	readonly currentState: BaseValueNodeState<Value>;
	readonly validationState: LeafNodeValidationState;
	readonly instanceState: InstanceState;
}
