import type { Accessor } from 'solid-js';
import type { TextRange } from '../client/TextRange.ts';
import type { TriggerNode, TriggerNodeDefinition } from '../client/TriggerNode.ts';
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
import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';

interface TriggerControlStateSpec extends DescendantNodeStateSpec<boolean> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly children: null;
	readonly value: SimpleAtomicState<boolean>;
	readonly valueOptions: null;
}

const TRIGGER_ASSIGNED_VALUE = 'OK';

export class TriggerControl
	extends DescendantNode<TriggerNodeDefinition, TriggerControlStateSpec, null>
	implements
		TriggerNode,
		EvaluationContext,
		SubscribableDependency,
		ValidationContext,
		ValueContext<boolean>
{
	private readonly validation: SharedValidationState;
	protected readonly state: SharedNodeState<TriggerControlStateSpec>;

	// InstanceNode
	protected engineState: EngineState<TriggerControlStateSpec>;

	// TriggerNode
	readonly nodeType = 'trigger';
	readonly appearances: UnknownAppearanceDefinition;
	readonly currentState: CurrentState<TriggerControlStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	// ValueContext
	readonly encodeValue: (runtimeValue: boolean) => string;
	readonly decodeValue: (instanceValue: string) => boolean;

	constructor(parent: GeneralParentNode, definition: TriggerNodeDefinition) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;
		this.encodeValue = (runtimeValue) => {
			return runtimeValue ? TRIGGER_ASSIGNED_VALUE : '';
		};
		this.decodeValue = (instanceValue) => {
			const value = instanceValue.trim();

			switch (value) {
				case TRIGGER_ASSIGNED_VALUE:
					return true;

				case '':
					return false;

				// TODO (robustness principle): Case insensitivity? Handle
				// XPath-semantic booleans?? Other known/common equivalents?
				default:
					throw new Error(`Unexpected trigger value: ${value}`);
			}
		};

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

	// ValidationContext
	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	isBlank(): boolean {
		return this.engineState.value == null;
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}

	// TriggerNode
	setValue(value: boolean): Root {
		this.state.setProperty('value', value);

		return this.root;
	}
}
