import { identity } from '@getodk/common/lib/identity.ts';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { ModelValueNode } from '../client/ModelValueNode.ts';
import type { SubmissionState } from '../client/submission/SubmissionState.ts';
import type { AnyViolation, LeafNodeValidationState } from '../client/validation.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { createLeafNodeSubmissionState } from '../lib/client-reactivity/submission/createLeafNodeSubmissionState.ts';
import { createValueState } from '../lib/reactivity/createValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { SharedValidationState } from '../lib/reactivity/validation/createValidation.ts';
import { createValidationState } from '../lib/reactivity/validation/createValidation.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ValueContext } from './internal-api/ValueContext.ts';
import type { ClientReactiveSubmittableLeafNode } from './internal-api/submission/ClientReactiveSubmittableLeafNode.ts';

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
	extends DescendantNode<ModelValueDefinition, ModelValueStateSpec, GeneralParentNode, null>
	implements
		ModelValueNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ValueContext<string>,
		ClientReactiveSubmittableLeafNode<string>
{
	private readonly validation: SharedValidationState;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<ModelValueStateSpec>;
	protected readonly engineState: EngineState<ModelValueStateSpec>;

	// ModelValueNode
	readonly nodeType = 'model-value';
	readonly appearances = null;
	readonly currentState: CurrentState<ModelValueStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	readonly submissionState: SubmissionState;

	// ValueContext
	override readonly contextNode = this;
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
		this.submissionState = createLeafNodeSubmissionState(this);
	}

	// XFormsXPathElement
	override getXPathValue(): string {
		return this.engineState.value;
	}

	// ValidationContext
	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	isBlank(): boolean {
		return this.engineState.value === '';
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}
}
