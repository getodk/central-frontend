import { identity } from '@getodk/common/lib/identity.ts';
import type { ModelValueNode } from '../client/ModelValueNode.ts';
import type { AnyViolation, LeafNodeValidationState } from '../client/validation.ts';
import { createValueState } from '../lib/reactivity/createValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { SharedValidationState } from '../lib/reactivity/validation/createValidation.ts';
import { createValidationState } from '../lib/reactivity/validation/createValidation.ts';
import type { LeafNodeDefinition } from '../model/LeafNodeDefinition.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';

export interface ModelValueDefinition extends LeafNodeDefinition {
	readonly bodyElement: null;
}

interface ModelValueStateSpec extends DescendantNodeStateSpec<string> {
	readonly label: null;
	readonly hint: null;
	readonly children: null;
	readonly value: SimpleAtomicState<string>;
	readonly valueOptions: null;
}

export class ModelValue
	extends DescendantNode<ModelValueDefinition, ModelValueStateSpec, null>
	implements
		ModelValueNode,
		EvaluationContext,
		SubscribableDependency,
		ValidationContext,
		ValueContext<string>
{
	private readonly validation: SharedValidationState;
	protected readonly state: SharedNodeState<ModelValueStateSpec>;

	// InstanceNode
	protected engineState: EngineState<ModelValueStateSpec>;

	// ModelValueNode
	readonly nodeType = 'model-value';
	readonly appearances = null;
	readonly currentState: CurrentState<ModelValueStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	// ValueContext
	readonly encodeValue = identity<string>;
	readonly decodeValue = identity<string>;

	constructor(parent: GeneralParentNode, definition: ModelValueDefinition) {
		super(parent, definition);

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

				label: null,
				hint: null,
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
}
