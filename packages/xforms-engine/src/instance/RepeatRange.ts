import type { RepeatRangeNode, RepeatRangeNodeState } from '../client/RepeatRangeNode.ts';
import type { RepeatSequenceDefinition } from '../model/RepeatSequenceDefinition.ts';
import type { RepeatInstance } from './RepeatInstance.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RepeatRangeState extends RepeatRangeNodeState, DescendantNodeState {
	get hint(): null;
	get label(): null;
	get children(): readonly RepeatInstance[];
	get valueOptions(): null;
	get value(): null;
}

export abstract class RepeatRange
	extends DescendantNode<RepeatSequenceDefinition, RepeatRangeState>
	implements RepeatRangeNode, EvaluationContext, SubscribableDependency
{
	constructor(parent: GeneralParentNode, definition: RepeatSequenceDefinition) {
		super(parent, definition);
	}

	abstract addInstances(afterIndex?: number | undefined, count?: number | undefined): Root;
	abstract removeInstances(startIndex: number, count?: number | undefined): Root;
}
