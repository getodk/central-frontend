import { createSignal, type Signal } from 'solid-js';
import type { GroupDefinition, GroupNode, GroupNodeState } from '../client/GroupNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { InstanceNodeStateSpec } from './abstract/InstanceNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface GroupState extends GroupNodeState, DescendantNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

// prettier-ignore
type GroupStateSpec = InstanceNodeStateSpec<GroupState, {
	readonly children: Signal<readonly GeneralChildNode[]>;
}>;

export class Group
	extends DescendantNode<GroupDefinition, GroupState>
	implements GroupNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<GroupStateSpec>;
	protected override engineState: EngineState<GroupState>;

	readonly currentState: CurrentState<GroupState>;

	constructor(parent: GeneralParentNode, definition: GroupDefinition) {
		super(parent, definition);

		const state = createSharedNodeState(
			this.scope,
			{
				reference: `${parent.contextReference}/${definition.nodeName}`,
				readonly: false,
				relevant: true,
				required: false,
				label: null,
				hint: null,
				children: createSignal<readonly GeneralChildNode[]>([]),
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

		state.setProperty('children', buildChildren(this));
	}
}
