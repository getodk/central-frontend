import { createSignal, type Signal } from 'solid-js';
import type { SubtreeDefinition, SubtreeNode } from '../client/SubtreeNode.ts';
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

interface SubtreeStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: null;
	readonly hint: null;
	readonly children: Signal<readonly GeneralChildNode[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class Subtree
	extends DescendantNode<SubtreeDefinition, SubtreeStateSpec>
	implements SubtreeNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<SubtreeStateSpec>;
	protected override engineState: EngineState<SubtreeStateSpec>;

	readonly currentState: CurrentState<SubtreeStateSpec>;

	constructor(parent: GeneralParentNode, definition: SubtreeDefinition) {
		super(parent, definition);

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

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

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}
}
