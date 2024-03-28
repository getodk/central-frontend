import type {
	RepeatDefinition,
	RepeatInstanceNode,
	RepeatInstanceNodeState,
} from '../client/RepeatInstanceNode.ts';
import type { RepeatRange } from './RepeatRange.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RepeatInstanceState extends RepeatInstanceNodeState, DescendantNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export abstract class RepeatInstance
	extends DescendantNode<RepeatDefinition, RepeatInstanceState>
	implements RepeatInstanceNode, EvaluationContext, SubscribableDependency
{
	abstract override readonly parent: RepeatRange;

	constructor(parent: RepeatRange, definition: RepeatDefinition) {
		super(parent, definition);
	}
}
