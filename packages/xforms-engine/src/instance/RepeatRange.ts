import type { Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { RepeatRangeNode } from '../client/RepeatRangeNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { RepeatSequenceDefinition } from '../model/RepeatSequenceDefinition.ts';
import { RepeatInstance } from './RepeatInstance.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RepeatRangeStateSpec extends DescendantNodeSharedStateSpec {
	readonly hint: null;
	readonly label: null;
	readonly children: Signal<readonly RepeatInstance[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class RepeatRange
	extends DescendantNode<RepeatSequenceDefinition, RepeatRangeStateSpec>
	implements RepeatRangeNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<RepeatRangeStateSpec>;
	protected override engineState: EngineState<RepeatRangeStateSpec>;

	readonly currentState: CurrentState<RepeatRangeStateSpec>;

	constructor(parent: GeneralParentNode, definition: RepeatSequenceDefinition) {
		super(parent, definition);

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				label: null,
				hint: null,
				children: createSignal<readonly RepeatInstance[]>([]),
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

		const initialInstances = definition.instances.map((instanceDefinition, index) => {
			return new RepeatInstance(this, instanceDefinition, index);
		});

		state.setProperty('children', initialInstances);
	}

	protected override initializeContextNode(parentContextNode: Element): Element {
		return parentContextNode;
	}

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}

	getInstanceIndex(instance: RepeatInstance): number {
		return this.engineState.children.indexOf(instance);
	}

	addInstances(_afterIndex?: number | undefined, _count?: number | undefined): Root {
		throw new Error('Not implemented');
	}

	removeInstances(_startIndex: number, _count?: number | undefined): Root {
		throw new Error('Not implemented');
	}
}
