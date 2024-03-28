import type { SubtreeDefinition, SubtreeNode, SubtreeNodeState } from '../client/SubtreeNode.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface SubtreeState extends SubtreeNodeState, DescendantNodeState {
	get hint(): null;
	get label(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export abstract class Subtree
	extends DescendantNode<SubtreeDefinition, SubtreeState>
	implements SubtreeNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: SubtreeDefinition) {
		super(parent, definition);
	}
}
