import { identity } from '@getodk/common/lib/identity.ts';
import type { Accessor } from 'solid-js';
import type { InputDefinition } from '../body/control/InputDefinition.ts';
import type { StringNode, StringNodeAppearances } from '../client/StringNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { AnyViolation, LeafNodeValidationState } from '../client/validation.ts';
import { createValueState } from '../lib/reactivity/createValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { SharedValidationState } from '../lib/reactivity/validation/createValidation.ts';
import { createValidationState } from '../lib/reactivity/validation/createValidation.ts';
import type { LeafNodeDefinition } from '../model/LeafNodeDefinition.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';

export interface StringFieldDefinition extends LeafNodeDefinition {
	readonly bodyElement: InputDefinition;
}

interface StringFieldStateSpec extends DescendantNodeStateSpec<string> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly children: null;
	readonly value: SimpleAtomicState<string>;
	readonly valueOptions: null;
}

export class StringField
	extends DescendantNode<StringFieldDefinition, StringFieldStateSpec, null>
	implements
		StringNode,
		EvaluationContext,
		SubscribableDependency,
		ValidationContext,
		ValueContext<string>
{
	private readonly validation: SharedValidationState;
	protected readonly state: SharedNodeState<StringFieldStateSpec>;

	// InstanceNode
	protected engineState: EngineState<StringFieldStateSpec>;

	// StringNode
	readonly nodeType = 'string';
	readonly appearances: StringNodeAppearances;
	readonly currentState: CurrentState<StringFieldStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	// ValueContext
	readonly encodeValue = identity<string>;

	readonly decodeValue = identity<string>;

	constructor(parent: GeneralParentNode, definition: StringFieldDefinition) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: this.isReadonly,
				relevant: this.isRelevant,
				required: this.isRequired,

				label: createNodeLabel(this, definition),
				hint: createFieldHint(this, definition),
				children: null,
				valueOptions: null,
				value: createValueState(this),
			},
			sharedStateOptions
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.validation = createValidationState(this, sharedStateOptions);
	}

	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	// ValidationContext
	isBlank(): boolean {
		return this.engineState.value === '';
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}

	// StringNode
	setValue(value: string): Root {
		this.state.setProperty('value', value);

		return this.root;
	}
}
