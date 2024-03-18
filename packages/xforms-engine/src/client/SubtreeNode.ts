import type { SubtreeDefinition as BaseSubtreeDefinition } from '../model/SubtreeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';

export interface SubtreeNodeState extends BaseNodeState {
	get label(): null;
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

// TODO: obviously there is a naming inconsistency emerging here.
export interface SubtreeDefinition extends BaseSubtreeDefinition {
	readonly bodyElement: null;
}

/**
 * A non-root node which has children, but **no** corresponding XForms
 * `<group>`. A subtree node does not have any direct implications for
 * presentation to users, but its descendants may specify presentational details
 * in their own {@link BaseNode.definition | definition}s.
 */
// TODO: directly test presentation of non-group subtree children/descendants
export interface SubtreeNode extends BaseNode {
	readonly definition: SubtreeDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: SubtreeNodeState;
}
