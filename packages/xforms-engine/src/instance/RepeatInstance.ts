import type {
	RepeatDefinition,
	RepeatInstanceNode,
	RepeatInstanceNodeState,
} from '../client/RepeatInstanceNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
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

export class RepeatInstance
	extends DescendantNode<RepeatDefinition, RepeatInstanceState>
	implements RepeatInstanceNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<RepeatInstanceState>;
	protected override engineState: EngineState<RepeatInstanceState>;

	readonly currentState: CurrentState<RepeatInstanceState>;

	constructor(
		override readonly parent: RepeatRange,
		definition: RepeatDefinition,
		initialIndex: number
	) {
		super(parent, definition);

		const initialPosition = initialIndex + 1;

		const state = createSharedNodeState<RepeatInstanceState>(
			this.scope,
			{
				reference: `${parent.contextReference}[${initialPosition}]`,
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
