import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { PageBoundary } from '../client/identity.ts';
import type {
  RangeInputValue,
  RangeNode,
  RangeNodeAppearances,
  RangeNodeOptions,
  RangeTickLabel,
  RangeValue,
} from '../client/RangeNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import { RangeCodec } from '../lib/codecs/RangeCodec.ts';
import { getSharedValueCodec } from '../lib/codecs/getSharedValueCodec.ts';
import { createItemCollection } from '../lib/reactivity/createItemCollection.ts';
import {
  createAttributeState,
  type AttributeState,
} from '../lib/reactivity/createAttributeState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import { isNumericString } from '../parse/body/control/RangeControlDefinition.ts';
import type {
  AnyRangeNodeDefinition,
  RangeNodeDefinition,
  RangeValueType,
} from '../parse/model/RangeNodeDefinition.ts';
import type { Attribute } from './Attribute.ts';
import type { Root } from './Root.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import { buildAttributes } from './buildAttributes.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';

interface RangeControlStateSpec<V extends RangeValueType> extends ValueNodeStateSpec<
  RangeValue<V>
> {
  readonly label: Accessor<TextRange<'label'> | null>;
  readonly hint: Accessor<TextRange<'hint'> | null>;
  readonly valueOptions: null;
  readonly tickLabels: Accessor<readonly RangeTickLabel[]>;
  readonly pageBoundary: PageBoundary;
}

/**
 * Per {@link https://getodk.github.io/xforms-spec/#range-tick-labels | ODK XForms spec},
 * an item needs a numeric value within the range, and the first item for a value wins.
 */
const createTickLabels = <V extends RangeValueType>(
  control: RangeControl<V>
): Accessor<readonly RangeTickLabel[]> => {
  const items = createItemCollection(control);
  const { start, end } = control.definition.bounds;
  const min = Math.min(Number(start), Number(end));
  const max = Math.max(Number(start), Number(end));

  return control.scope.runTask(() => {
    return createMemo(() => {
      const labelsByValue = new Map<number, RangeTickLabel>();

      items().forEach(({ value, label }) => {
        if (!isNumericString(value)) {
          return;
        }

        const numericValue = Number(value);
        const isWithinBounds = numericValue >= min && numericValue <= max;
        if (isWithinBounds && !labelsByValue.has(numericValue)) {
          labelsByValue.set(numericValue, { value: numericValue, label });
        }
      });

      return Array.from(labelsByValue.values()).sort(
        (a: RangeTickLabel, b: RangeTickLabel) => a.value - b.value
      );
    });
  });
};

export class RangeControl<V extends RangeValueType = RangeValueType>
  extends ValueNode<V, RangeNodeDefinition<V>, RangeValue<V>, RangeInputValue<V>>
  implements
    RangeNode<V>,
    XFormsXPathElement,
    EvaluationContext,
    ValidationContext,
    ClientReactiveSerializableValueNode
{
  static from(
    parent: GeneralParentNode,
    instanceNode: StaticLeafElement | null,
    definition: AnyRangeNodeDefinition
  ): AnyRangeControl;
  static from<V extends RangeValueType>(
    parent: GeneralParentNode,
    instanceNode: StaticLeafElement | null,
    definition: RangeNodeDefinition<V>
  ): RangeControl<V> {
    return new this<V>(parent, instanceNode, definition);
  }

  // XFormsXPathElement
  override readonly [XPathNodeKindKey] = 'element';

  // InstanceNode
  protected readonly state: SharedNodeState<RangeControlStateSpec<V>>;
  protected readonly engineState: EngineState<RangeControlStateSpec<V>>;
  readonly attributeState: AttributeState;

  // RangeNode
  readonly nodeType = 'range';
  readonly appearances: RangeNodeAppearances;
  readonly nodeOptions: RangeNodeOptions;
  readonly currentState: CurrentState<RangeControlStateSpec<V>>;

  constructor(
    parent: GeneralParentNode,
    instanceNode: StaticLeafElement | null,
    definition: RangeNodeDefinition<V>
  ) {
    const baseCodec = getSharedValueCodec(definition.valueType);
    const codec = new RangeCodec(baseCodec, definition);

    super(parent, instanceNode, definition, codec);

    this.appearances = definition.bodyElement.appearances;
    this.nodeOptions = definition.bodyElement.options;
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
        attributes: this.attributeState.getAttributes,
        valueOptions: null,
        tickLabels: createTickLabels(this),
        value: this.valueState,
        instanceValue: this.getInstanceValue,
        pageBoundary: this.root.pagination.attachLeaf(this),
      },
      this.instanceConfig
    );

    this.attributeState.setAttributes(buildAttributes(this));

    this.state = state;
    this.engineState = state.engineState;
    this.currentState = state.currentState;
  }

  setValue(value: RangeInputValue<V>): Root {
    this.setValueState(value);

    return this.root;
  }

  override getAttributes(): readonly Attribute[] {
    return this.attributeState.getAttributes();
  }
}

// prettier-ignore
export type AnyRangeControl =
	| RangeControl<'decimal'>
	| RangeControl<'int'>;
