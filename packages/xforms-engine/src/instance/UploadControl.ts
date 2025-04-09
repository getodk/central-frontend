import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { TextRange } from '../client/TextRange.ts';
import type { UploadDefinition, UploadNode, UploadNodeOptions } from '../client/UploadNode.ts';
import type { ValueType } from '../client/ValueType.ts';
import type { InstanceAttachmentFileName, InstanceState } from '../client/index.ts';
import type { AnyViolation, LeafNodeValidationState } from '../client/validation.ts';
import { UploadValueTypeError } from '../error/UploadValueTypeError.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import { createValueNodeInstanceState } from '../lib/client-reactivity/instance-state/createValueNodeInstanceState.ts';
import { createInstanceAttachment } from '../lib/reactivity/createInstanceAttachment.ts';
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
import type {
	InstanceAttachment,
	InstanceAttachmentRuntimeValue,
} from './attachments/InstanceAttachment.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { InstanceAttachmentContext } from './internal-api/InstanceAttachmentContext.ts';
import type {
	DecodeInstanceValue,
	InstanceValueContext,
} from './internal-api/InstanceValueContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';

export type AnyUploadDefinition = {
	[V in ValueType]: UploadDefinition<V>;
}[ValueType];

type AssertUploadDefinition = (
	definition: AnyUploadDefinition
) => asserts definition is UploadDefinition<'binary'>;

const assertUploadDefinition: AssertUploadDefinition = (definition) => {
	const { valueType } = definition;

	if (valueType !== 'binary') {
		throw new UploadValueTypeError(definition);
	}
};

interface UploadControlStateSpec extends DescendantNodeStateSpec<InstanceAttachmentRuntimeValue> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly children: null;
	readonly valueOptions: null;
	readonly value: SimpleAtomicState<InstanceAttachmentRuntimeValue>;
	readonly instanceValue: Accessor<InstanceAttachmentFileName>;
}

export class UploadControl
	extends DescendantNode<
		UploadDefinition<'binary'>,
		UploadControlStateSpec,
		GeneralParentNode,
		null
	>
	implements
		UploadNode,
		XFormsXPathElement,
		EvaluationContext,
		InstanceAttachmentContext,
		InstanceValueContext,
		ValidationContext,
		ClientReactiveSerializableValueNode
{
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: UploadDefinition
	): UploadControl;
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: AnyUploadDefinition
	): UploadControl {
		assertUploadDefinition(definition);

		return new this(parent, instanceNode, definition);
	}

	private readonly validation: SharedValidationState;
	private readonly instanceAttachment: InstanceAttachment;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';
	override readonly getXPathValue: () => InstanceAttachmentFileName;

	// InstanceNode
	protected readonly state: SharedNodeState<UploadControlStateSpec>;
	protected readonly engineState: EngineState<UploadControlStateSpec>;

	// InstanceValueContext
	readonly decodeInstanceValue: DecodeInstanceValue;

	// UploadNode
	readonly nodeType = 'upload';
	readonly valueType = 'binary';
	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions: UploadNodeOptions;
	readonly currentState: CurrentState<UploadControlStateSpec>;

	get validationState(): LeafNodeValidationState {
		return this.validation.currentState;
	}

	readonly instanceState: InstanceState;

	private constructor(
		parent: GeneralParentNode,
		override readonly instanceNode: StaticLeafElement | null,
		definition: UploadDefinition<'binary'>
	) {
		super(parent, instanceNode, definition);

		this.appearances = definition.bodyElement.appearances;
		this.nodeOptions = definition.bodyElement.options;

		const instanceAttachment = createInstanceAttachment(this);

		this.instanceAttachment = instanceAttachment;
		this.decodeInstanceValue = instanceAttachment.decodeInstanceValue;
		this.getXPathValue = instanceAttachment.getInstanceValue;

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
				value: instanceAttachment.valueState,
				instanceValue: instanceAttachment.getInstanceValue,
			},
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.validation = createValidationState(this, this.instanceConfig);
		this.instanceState = createValueNodeInstanceState(this);
	}

	// ValidationContext
	getViolation(): AnyViolation | null {
		return this.validation.engineState.violation;
	}

	isBlank(): boolean {
		return this.getXPathValue() === '';
	}

	// InstanceNode
	getChildren(): readonly [] {
		return [];
	}

	// UploadNode
	setValue(value: InstanceAttachmentRuntimeValue): Root {
		this.instanceAttachment.setValue(value);

		return this.root;
	}
}
