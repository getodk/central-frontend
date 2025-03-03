import type { TriggerRuntimeValue, TriggerValueType } from '../lib/codecs/TriggerCodec.ts';
import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { TriggerControlDefinition } from '../parse/body/control/TriggerControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { RootNode } from './RootNode.ts';
import type { LeafNodeValidationState } from './validation.ts';
import type { ValueType } from './ValueType.ts';

export type TriggerValue = TriggerRuntimeValue;

export interface TriggerNodeState extends BaseValueNodeState<TriggerValue> {
	get children(): null;
	get valueOptions(): null;
	get value(): TriggerValue;
}

export interface TriggerNodeDefinition<V extends ValueType = ValueType>
	extends LeafNodeDefinition<V> {
	readonly bodyElement: TriggerControlDefinition;
}

export interface TriggerNode extends BaseValueNode<TriggerValueType, TriggerValue> {
	readonly nodeType: 'trigger';
	readonly definition: TriggerNodeDefinition<TriggerValueType>;
	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions: null;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: TriggerNodeState;
	readonly validationState: LeafNodeValidationState;

	setValue(value: boolean): RootNode;
}
