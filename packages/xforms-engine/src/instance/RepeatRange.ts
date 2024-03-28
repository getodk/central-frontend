import { createSignal, type Signal } from 'solid-js';
import type { RepeatRangeNode, RepeatRangeNodeState } from '../client/RepeatRangeNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { RepeatSequenceDefinition } from '../model/RepeatSequenceDefinition.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { InstanceNodeStateSpec } from './abstract/InstanceNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import { RepeatInstance } from './RepeatInstance.ts';
import type { Root } from './Root.ts';

interface RepeatRangeState extends RepeatRangeNodeState, DescendantNodeState {
	get hint(): null;
	get label(): null;
	get children(): readonly RepeatInstance[];
	get valueOptions(): null;
	get value(): null;
}

// prettier-ignore
type RepeatRangeStateSpec = InstanceNodeStateSpec<RepeatRangeState, {
	readonly children: Signal<readonly RepeatInstance[]>;
}>;

export class RepeatRange
	extends DescendantNode<RepeatSequenceDefinition, RepeatRangeState>
	implements RepeatRangeNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<RepeatRangeStateSpec>;
	protected override engineState: EngineState<RepeatRangeState>;

	readonly currentState: CurrentState<RepeatRangeState>;

	constructor(parent: GeneralParentNode, definition: RepeatSequenceDefinition) {
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

	addInstances(_afterIndex?: number | undefined, _count?: number | undefined): Root {
		throw new Error('Not implemented');
	}

	removeInstances(_startIndex: number, _count?: number | undefined): Root {
		throw new Error('Not implemented');
	}
}
