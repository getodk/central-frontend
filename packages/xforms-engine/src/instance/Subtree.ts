import type { SubtreeDefinition, SubtreeNode, SubtreeNodeState } from '../client/SubtreeNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
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

export class Subtree
	extends DescendantNode<SubtreeDefinition, SubtreeState>
	implements SubtreeNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<SubtreeState>;
	protected override engineState: EngineState<SubtreeState>;

	readonly currentState: CurrentState<SubtreeState>;

	constructor(parent: GeneralParentNode, definition: SubtreeDefinition) {
		super(parent, definition);

		const state = createSharedNodeState<SubtreeState>(
			this.scope,
			{
				reference: `${parent.contextReference}/${definition.nodeName}`,
				readonly: false,
				relevant: true,
				required: false,
				label: null,
				hint: null,
				children: [],
				valueOptions: null,
				value: null,
			},
			{
				clientStateFactory: this.engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}
}
