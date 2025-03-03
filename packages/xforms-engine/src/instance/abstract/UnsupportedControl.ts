import { identity } from '@getodk/common/lib/identity.ts';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { UnsupportedControlNodeType } from '../../client/node-types.ts';
import type { SubmissionState } from '../../client/submission/SubmissionState.ts';
import type { TextRange } from '../../client/TextRange.ts';
import type {
	UnsupportedControlDefinition,
	UnsupportedControlElementDefinition,
	UnsupportedControlNode,
} from '../../client/unsupported/UnsupportedControlNode.ts';
import type { AnyViolation, LeafNodeValidationState } from '../../client/validation.ts';
import type { XFormsXPathElement } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import { createLeafNodeSubmissionState } from '../../lib/client-reactivity/submission/createLeafNodeSubmissionState.ts';
import { createValueState } from '../../lib/reactivity/createValueState.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import {
	createSharedNodeState,
	type SharedNodeState,
} from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../../lib/reactivity/text/createNodeLabel.ts';
import type { SimpleAtomicState } from '../../lib/reactivity/types.ts';
import {
	createValidationState,
	type SharedValidationState,
} from '../../lib/reactivity/validation/createValidation.ts';
import type { UnknownAppearanceDefinition } from '../../parse/body/appearance/unknownAppearanceParser.ts';
import type { AnyUnsupportedControl, GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableLeafNode } from '../internal-api/submission/ClientReactiveSubmittableLeafNode.ts';
import type { ValidationContext } from '../internal-api/ValidationContext.ts';
import type { ValueContext } from '../internal-api/ValueContext.ts';
import { DescendantNode, type DescendantNodeStateSpec } from './DescendantNode.ts';

type TypedUnsupportedControlElementDefinition<Type extends UnsupportedControlNodeType> = Extract<
	UnsupportedControlElementDefinition,
	{ readonly type: Type }
>;

interface TypedUnsupportedControlDefinition<Type extends UnsupportedControlNodeType>
	extends UnsupportedControlDefinition {
	readonly bodyElement: TypedUnsupportedControlElementDefinition<Type>;
}

interface UnsupportedControlStateSpec extends DescendantNodeStateSpec<unknown> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly children: null;
	readonly value: SimpleAtomicState<unknown>;
	readonly valueOptions: never;
}

class UnsupportedControlValueEncodeError extends Error {
	constructor(type: UnsupportedControlNodeType) {
		super(`Cannot encode state for node (type: ${type}) - not implemented`);
	}
}

class UnsupportedControlWriteError extends Error {
	constructor(type: UnsupportedControlNodeType) {
		super(`Cannot write state for node (type: ${type}) - not implemented`);
	}
}

export abstract class UnsupportedControl<Type extends UnsupportedControlNodeType>
	extends DescendantNode<
		TypedUnsupportedControlDefinition<Type>,
		UnsupportedControlStateSpec,
		GeneralParentNode,
		null
	>
	implements
		UnsupportedControlNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ValueContext<unknown>,
		ClientReactiveSubmittableLeafNode<unknown>
{
	private readonly validation: SharedValidationState;
	protected readonly state: SharedNodeState<UnsupportedControlStateSpec>;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly engineState: EngineState<UnsupportedControlStateSpec>;

	// UnsupportedControlNode
	abstract override readonly nodeType: Type;

	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<UnsupportedControlStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	readonly submissionState: SubmissionState;

	// ValueContext
	abstract override readonly contextNode: AnyUnsupportedControl & this;

	readonly encodeValue = (instanceValue: unknown): string => {
		const encoded = instanceValue;

		if (typeof encoded === 'string') {
			return encoded;
		}

		throw new UnsupportedControlValueEncodeError(this.nodeType);
	};

	readonly decodeValue = (instanceValue: unknown): unknown => {
		return identity(instanceValue);
	};

	constructor(parent: GeneralParentNode, definition: TypedUnsupportedControlDefinition<Type>) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const stateSpec: UnsupportedControlStateSpec = {
			reference: this.contextReference,
			readonly: this.isReadonly,
			relevant: this.isRelevant,
			required: this.isRequired,

			label: createNodeLabel(this, definition),
			hint: createFieldHint(this, definition),
			children: null,
			valueOptions: null as never,
			value: createValueState<unknown>(this),
		};

		const state = createSharedNodeState(this.scope, stateSpec, sharedStateOptions);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.validation = createValidationState(this, sharedStateOptions);
		this.submissionState = createLeafNodeSubmissionState(this);
	}

	// XFormsXPathElement
	override getXPathValue(): string {
		return this.encodeValue(this.engineState.value);
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

	// UnsupportedControlNode
	setValue(_: never): never {
		throw new UnsupportedControlWriteError(this.nodeType);
	}
}
