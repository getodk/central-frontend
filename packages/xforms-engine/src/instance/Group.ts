import type { Accessor, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { GroupDefinition, GroupNode } from '../client/GroupNode.ts';
import type { TextRange } from '../index.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

// prettier-ignore
interface GroupStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: null;
	readonly children: Signal<readonly GeneralChildNode[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class Group
	extends DescendantNode<GroupDefinition, GroupStateSpec>
	implements GroupNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<GroupStateSpec>;
	protected override engineState: EngineState<GroupStateSpec>;

	readonly currentState: CurrentState<GroupStateSpec>;

	constructor(parent: GeneralParentNode, definition: GroupDefinition) {
		super(parent, definition);

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				label: () => null,
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

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}
}
