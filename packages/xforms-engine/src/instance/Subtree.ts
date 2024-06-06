import { type Accessor } from 'solid-js';
import type { SubtreeDefinition, SubtreeNode } from '../client/SubtreeNode.ts';
import type { ChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { NodeID } from './identity.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface SubtreeStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: null;
	readonly hint: null;
	readonly children: Accessor<readonly NodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class Subtree
	extends DescendantNode<SubtreeDefinition, SubtreeStateSpec, GeneralChildNode>
	implements SubtreeNode, EvaluationContext, SubscribableDependency
{
	private readonly childrenState: ChildrenState<GeneralChildNode>;

	// InstanceNode
	protected readonly state: SharedNodeState<SubtreeStateSpec>;
	protected engineState: EngineState<SubtreeStateSpec>;

	// SubtreeNode
	readonly nodeType = 'subtree';
	readonly appearances = null;
	readonly currentState: MaterializedChildren<CurrentState<SubtreeStateSpec>, GeneralChildNode>;

	constructor(parent: GeneralParentNode, definition: SubtreeDefinition) {
		super(parent, definition);

		const childrenState = createChildrenState<Subtree, GeneralChildNode>(this);

		this.childrenState = childrenState;

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				label: null,
				hint: null,
				children: childrenState.childIds,
				valueOptions: null,
				value: null,
			},
			{
				clientStateFactory: this.engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(state.currentState, childrenState);

		childrenState.setChildren(buildChildren(this));
	}

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}
}
