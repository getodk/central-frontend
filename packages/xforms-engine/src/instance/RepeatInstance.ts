import type { Accessor, Signal } from 'solid-js';
import { createComputed, createMemo, createSignal, on } from 'solid-js';
import type { RepeatDefinition, RepeatInstanceNode } from '../client/RepeatInstanceNode.ts';
import type { TextRange } from '../index.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { RepeatRange } from './RepeatRange.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RepeatInstanceStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: null;
	readonly children: Signal<readonly GeneralChildNode[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class RepeatInstance
	extends DescendantNode<RepeatDefinition, RepeatInstanceStateSpec>
	implements RepeatInstanceNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<RepeatInstanceStateSpec>;
	protected override engineState: EngineState<RepeatInstanceStateSpec>;

	readonly currentState: CurrentState<RepeatInstanceStateSpec>;

	private readonly currentIndex: Accessor<number>;

	constructor(
		override readonly parent: RepeatRange,
		definition: RepeatDefinition,
		initialIndex: number
	) {
		super(parent, definition);

		const [currentIndex, setCurrentIndex] = createSignal(initialIndex);

		this.currentIndex = currentIndex;

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

		// Maintain current index state, updating as the parent range's children
		// state is changed. Notable Solid reactivity nuances:
		//
		// - `createComputed` is the Solid API which is explicitly called out for
		//   supporting performing reactive writes. It's also generally considered a
		//   "smell", but it seems the most appropriate for a first pass on this.
		// - `on(..., { defer: true })` allows us to *synchronously* delay reactive
		//   index updates until after the full form tree is built, where this
		//   `RepeatInstance` is being constructed but it hasn't yet been appended
		//   to the parent range's reactive `children`.
		// - the same logic for deferring reaction on form init should apply for
		//   adding new instances to a live form.
		this.scope.runTask(() => {
			createComputed(() => {
				const getIndex = createMemo(() => parent.getInstanceIndex(this));

				createComputed(
					on(
						getIndex,
						(index) => {
							setCurrentIndex(index);
						},
						{ defer: true }
					)
				);
			});
		});

		state.setProperty('children', buildChildren(this));
	}

	protected computeReference(parent: RepeatRange): string {
		const currentPosition = this.currentIndex() + 1;

		return `${parent.contextReference}[${currentPosition}]`;
	}
}
