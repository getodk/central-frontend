import { XPathNodeKindKey } from '@getodk/xpath';
import type { ModelValueDefinition, ModelValueNode } from '../client/ModelValueNode.ts';
import type { ValueType } from '../client/ValueType.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import type { RuntimeInputValue, RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import { getSharedValueCodec } from '../lib/codecs/getSharedValueCodec.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';

interface ModelValueStateSpec<V extends ValueType> extends ValueNodeStateSpec<RuntimeValue<V>> {
	readonly label: null;
	readonly hint: null;
	readonly valueOptions: null;
}

export class ModelValue<V extends ValueType = ValueType>
	extends ValueNode<V, ModelValueDefinition<V>, RuntimeValue<V>, RuntimeInputValue<V>>
	implements
		ModelValueNode<V>,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSerializableValueNode
{
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: ModelValueDefinition
	): AnyModelValue;
	static from<V extends ValueType>(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: ModelValueDefinition<V>
	): ModelValue<V> {
		return new this(parent, instanceNode, definition);
	}

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<ModelValueStateSpec<V>>;
	protected readonly engineState: EngineState<ModelValueStateSpec<V>>;

	// ModelValueNode
	readonly nodeType = 'model-value';
	readonly appearances = null;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<ModelValueStateSpec<V>>;

	constructor(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: ModelValueDefinition<V>
	) {
		const codec = getSharedValueCodec(definition.valueType);

		super(parent, instanceNode, definition, codec);

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
				value: this.valueState,
				instanceValue: this.getInstanceValue,
			},
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}
}

export type AnyModelValue =
	| ModelValue<'barcode'>
	| ModelValue<'binary'>
	| ModelValue<'boolean'>
	| ModelValue<'date'>
	| ModelValue<'dateTime'>
	| ModelValue<'decimal'>
	| ModelValue<'geopoint'>
	| ModelValue<'geoshape'>
	| ModelValue<'geotrace'>
	| ModelValue<'int'>
	| ModelValue<'intent'>
	| ModelValue<'string'>
	| ModelValue<'time'>;
