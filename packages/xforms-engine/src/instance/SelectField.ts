import { createSignal, type Accessor } from 'solid-js';
import type { AnySelectDefinition } from '../body/control/select/SelectDefinition.ts';
import type { SelectItem, SelectNode } from '../client/SelectNode.ts';
import type { TextRange } from '../index.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

export interface SelectFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: AnySelectDefinition;
}

interface SelectFieldStateSpec extends DescendantNodeStateSpec<readonly SelectItem[]> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly children: null;
	readonly value: SimpleAtomicState<readonly SelectItem[]>;
	readonly valueOptions: Accessor<readonly SelectItem[]>;
}

export class SelectField
	extends DescendantNode<SelectFieldDefinition, SelectFieldStateSpec>
	implements SelectNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<SelectFieldStateSpec>;
	protected override engineState: EngineState<SelectFieldStateSpec>;

	readonly currentState: CurrentState<SelectFieldStateSpec>;

	constructor(parent: GeneralParentNode, definition: SelectFieldDefinition) {
		super(parent, definition);

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				label: () => null,
				hint: () => null,
				children: null,
				valueOptions: (): readonly SelectItem[] => [],
				value: createSignal<readonly SelectItem[]>([]),
			},
			{
				clientStateFactory: this.engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}

	// SelectNode
	select(_item: SelectItem): Root {
		throw new Error('Not implemented');
	}

	deselect(_item: SelectItem): Root {
		throw new Error('Not implemented');
	}
}
