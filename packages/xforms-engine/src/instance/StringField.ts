import type { InputDefinition } from '../body/control/InputDefinition.ts';
import type { StringNode, StringNodeState } from '../client/StringNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeState } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

export interface StringFieldDefinition extends ValueNodeDefinition {
	readonly bodyElement: InputDefinition | null;
}

interface StringFieldState extends StringNodeState, DescendantNodeState {
	get children(): null;
	get valueOptions(): null;
	get value(): string;
}

export class StringField
	extends DescendantNode<StringFieldDefinition, StringFieldState>
	implements StringNode, EvaluationContext, SubscribableDependency
{
	protected readonly state: SharedNodeState<StringFieldState>;
	protected override engineState: EngineState<StringFieldState>;

	readonly currentState: CurrentState<StringFieldState>;

	constructor(parent: GeneralParentNode, definition: StringFieldDefinition) {
		super(parent, definition);

		const state = createSharedNodeState<StringFieldState>(
			this.scope,
			{
				reference: `${parent.contextReference}/${definition.nodeName}`,
				readonly: false,
				relevant: true,
				required: false,
				label: null,
				hint: null,
				children: null,
				valueOptions: null,
				value: '',
			},
			{
				clientStateFactory: this.engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}

	// StringNode
	setValue(_value: string): Root {
		throw new Error('Not implemented');
	}
}
