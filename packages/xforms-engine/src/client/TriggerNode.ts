import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { TriggerControlDefinition } from '../parse/body/control/TriggerControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { RootNode } from './RootNode.ts';
import type { LeafNodeValidationState } from './validation.ts';

export interface TriggerNodeState extends BaseNodeState {
	get children(): null;
	get valueOptions(): null;
	get value(): boolean;
}

export interface TriggerNodeDefinition extends LeafNodeDefinition {
	readonly bodyElement: TriggerControlDefinition;
}

export interface TriggerNode extends BaseNode {
	readonly nodeType: 'trigger';
	readonly definition: TriggerNodeDefinition;
	readonly appearances: UnknownAppearanceDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: TriggerNodeState;
	readonly validationState: LeafNodeValidationState;

	setValue(value: boolean): RootNode;
}
