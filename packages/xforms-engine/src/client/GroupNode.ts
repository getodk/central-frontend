import type { GroupElementDefinition } from '../parse/body/GroupElementDefinition.ts';
import type { GroupDefinition as GroupNodeDefinition } from '../parse/model/GroupDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { AncestorNodeValidationState } from './validation.ts';

export interface GroupNodeState extends BaseNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export interface GroupDefinition extends GroupNodeDefinition {
	readonly bodyElement: GroupElementDefinition;
}

export type GroupNodeAppearances = NodeAppearances<GroupDefinition>;

/**
 * A node corresponding to an XForms `<group>`.
 */
export interface GroupNode extends BaseNode {
	readonly nodeType: 'group';
	readonly appearances: GroupNodeAppearances;
	readonly nodeOptions: null;
	readonly definition: GroupDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: GroupNodeState;
	readonly validationState: AncestorNodeValidationState;
}
