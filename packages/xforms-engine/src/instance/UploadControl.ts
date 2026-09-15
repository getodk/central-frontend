import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { PageBoundary } from '../client/identity.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { UploadDefinition, UploadNode, UploadNodeOptions } from '../client/UploadNode.ts';
import type { ValueType } from '../client/ValueType.ts';
import { UploadValueTypeError } from '../error/UploadValueTypeError.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import { UploadCodec } from '../lib/codecs/UploadCodec.ts';
import {
  type AttributeState,
  createAttributeState,
} from '../lib/reactivity/createAttributeState.ts';
import type { BaseInstanceAttachmentState } from '../lib/reactivity/createInstanceAttachment.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { UploadAppearanceDefinition } from '../parse/body/appearance/uploadAppearanceParser.ts';
import type { Attribute } from './Attribute.ts';
import type { Root } from './Root.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import type {
  InstanceAttachment,
  InstanceAttachmentRuntimeValue,
} from './attachments/InstanceAttachment.ts';
import { buildAttributes } from './buildAttributes.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { InstanceAttachmentContext } from './internal-api/InstanceAttachmentContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';

export type AnyUploadDefinition = {
  [V in ValueType]: UploadDefinition<V>;
}[ValueType];

type AssertUploadDefinition = (
  definition: AnyUploadDefinition
) => asserts definition is UploadDefinition<'binary'>;

const codec = new UploadCodec();

const assertUploadDefinition: AssertUploadDefinition = (definition) => {
  const { valueType } = definition;

  if (valueType !== 'binary') {
    throw new UploadValueTypeError(definition);
  }
};

interface UploadControlStateSpec extends ValueNodeStateSpec<InstanceAttachmentRuntimeValue> {
  readonly label: Accessor<TextRange<'label'> | null>;
  readonly hint: Accessor<TextRange<'hint'> | null>;
  readonly valueOptions: null;
  readonly attachmentState: Accessor<BaseInstanceAttachmentState>;
  readonly pageBoundary: PageBoundary;
}

export class UploadControl
  extends ValueNode<
    'binary',
    UploadDefinition<'binary'>,
    InstanceAttachmentRuntimeValue,
    InstanceAttachmentRuntimeValue
  >
  implements
    UploadNode,
    XFormsXPathElement,
    EvaluationContext,
    InstanceAttachmentContext,
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

  private readonly instanceAttachment: InstanceAttachment;

  // XFormsXPathElement
  override readonly [XPathNodeKindKey] = 'element';

  // InstanceNode
  protected readonly state: SharedNodeState<UploadControlStateSpec>;
  protected readonly engineState: EngineState<UploadControlStateSpec>;
  readonly attributeState: AttributeState;

  // UploadNode
  readonly nodeType = 'upload';
  readonly maxPixels: number | null;
  readonly appearances: UploadAppearanceDefinition;
  readonly nodeOptions: UploadNodeOptions;
  readonly currentState: CurrentState<UploadControlStateSpec>;

  private constructor(
    parent: GeneralParentNode,
    instanceNode: StaticLeafElement | null,
    definition: UploadDefinition<'binary'>
  ) {
    super(parent, instanceNode, definition, codec);

    // Set by the codec's runtime state factory during `super()`
    this.instanceAttachment = this.rootDocument.attachments.get(this)!;
    this.appearances = definition.bodyElement.appearances;
    this.nodeOptions = definition.bodyElement.options;
    this.maxPixels = definition.bind.maxPixels;
    this.attributeState = createAttributeState(this.scope);

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
        value: this.valueState,
        attributes: this.attributeState.getAttributes,
        instanceValue: this.getInstanceValue,
        attachmentState: this.instanceAttachment.getState,
        pageBoundary: this.root.pagination.attachLeaf(this),
      },
      this.instanceConfig
    );

    this.attributeState.setAttributes(buildAttributes(this));

    this.state = state;
    this.engineState = state.engineState;
    this.currentState = state.currentState;
  }

  override getAttributes(): readonly Attribute[] {
    return this.attributeState.getAttributes();
  }

  // UploadNode
  setValue(value: InstanceAttachmentRuntimeValue): Root {
    this.setValueState(value);

    return this.root;
  }

  retryFetch() {
    this.instanceAttachment.retry();
  }

}
