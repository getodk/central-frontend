import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type {
	RangeInputValue,
	RangeNode,
	RangeNodeAppearances,
	RangeValue,
} from '../client/RangeNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { RangeCodec } from '../lib/codecs/RangeCodec.ts';
import { getSharedValueCodec } from '../lib/codecs/getSharedValueCodec.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type {
	AnyRangeNodeDefinition,
	RangeNodeDefinition,
	RangeValueType,
} from '../parse/model/RangeNodeDefinition.ts';
import type { Root } from './Root.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSubmittableValueNode } from './internal-api/submission/ClientReactiveSubmittableValueNode.ts';

interface RangeControlStateSpec<V extends RangeValueType>
	extends ValueNodeStateSpec<RangeValue<V>> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: null;
}

export class RangeControl<V extends RangeValueType = RangeValueType>
	extends ValueNode<V, RangeNodeDefinition<V>, RangeValue<V>, RangeInputValue<V>>
	implements
		RangeNode<V>,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSubmittableValueNode
{
	static from(parent: GeneralParentNode, definition: AnyRangeNodeDefinition): AnyRangeControl;
	static from<V extends RangeValueType>(
		parent: GeneralParentNode,
		definition: RangeNodeDefinition<V>
	): RangeControl<V> {
		return new this<V>(parent, definition);
	}

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<RangeControlStateSpec<V>>;
	protected readonly engineState: EngineState<RangeControlStateSpec<V>>;

	// RangeNode
	readonly nodeType = 'range';
	readonly appearances: RangeNodeAppearances;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<RangeControlStateSpec<V>>;

	constructor(parent: GeneralParentNode, definition: RangeNodeDefinition<V>) {
		const baseCodec = getSharedValueCodec(definition.valueType);
		const codec = new RangeCodec(baseCodec, definition);

		super(parent, definition, codec);

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
				value: this.valueState,
				instanceValue: this.getInstanceValue,
			},
			sharedStateOptions
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}

	setValue(value: RangeInputValue<V>): Root {
		this.setValueState(value);

		return this.root;
	}
}

// prettier-ignore
export type AnyRangeControl =
	| RangeControl<'decimal'>
	| RangeControl<'int'>;
