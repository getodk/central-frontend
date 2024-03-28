import type { GroupDefinition, GroupNode, GroupNodeState } from '../client/GroupNode.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface GroupState extends GroupNodeState, DescendantNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export abstract class Group
	extends DescendantNode<GroupDefinition, GroupState>
	implements GroupNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: GroupDefinition) {
		super(parent, definition);
	}
}
