import { createSignal, type Accessor } from 'solid-js';
import type { InputDefinition } from '../body/control/InputDefinition.ts';
import type { StringNode } from '../client/StringNode.ts';
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

export interface StringFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: InputDefinition | null;
}

interface StringFieldStateSpec extends DescendantNodeStateSpec<string> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly children: null;
	readonly value: SimpleAtomicState<string>;
	readonly valueOptions: null;
}

export class StringField
	extends DescendantNode<StringFieldDefinition, StringFieldStateSpec>
	implements StringNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<StringFieldStateSpec>;
	protected override engineState: EngineState<StringFieldStateSpec>;

	readonly currentState: CurrentState<StringFieldStateSpec>;

	constructor(parent: GeneralParentNode, definition: StringFieldDefinition) {
		super(parent, definition);

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				label: () => null,
				hint: () => null,
				children: null,
				valueOptions: null,
				value: createSignal(''),
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

	// StringNode
	setValue(_value: string): Root {
		throw new Error('Not implemented');
	}
}
