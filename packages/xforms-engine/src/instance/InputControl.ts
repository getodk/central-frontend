import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type {
	InputDefinition,
	InputNode,
	InputNodeAppearances,
	InputNodeInputValue,
	InputNodeOptions,
} from '../client/InputNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { ValueType } from '../client/ValueType.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import type { RuntimeInputValue, RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import { getSharedValueCodec } from '../lib/codecs/getSharedValueCodec.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { InputControlDefinition } from '../parse/body/control/InputControlDefinition.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { Root } from './Root.ts';

export type AnyInputDefinition = {
	[V in ValueType]: InputDefinition<V>;
}[ValueType];

const stringInputNodeOptions = (control: InputControlDefinition): InputNodeOptions<'string'> => ({
	rows: control.rows,
});

const geoInputNodeOptions = (
	control: InputControlDefinition
): InputNodeOptions<'geopoint' | 'geoshape' | 'geotrace'> => ({
	accuracyThreshold: control.accuracyThreshold,
	unacceptableAccuracyThreshold: control.unacceptableAccuracyThreshold,
});

type NodeOptionsFactory<V extends ValueType> = (
	controlDefinition: InputControlDefinition
) => InputNodeOptions<V>;

type NodeOptionsFactoryByType = {
	[V in ValueType]: NodeOptionsFactory<V>;
};

const nodeOptionsFactoryByType: NodeOptionsFactoryByType = {
	string: stringInputNodeOptions,
	int: () => null,
	boolean: () => null,
	decimal: () => null,
	date: () => null,
	time: () => null,
	dateTime: () => null,
	geopoint: geoInputNodeOptions,
	geotrace: geoInputNodeOptions,
	geoshape: geoInputNodeOptions,
	binary: () => null,
	barcode: () => null,
	intent: () => null,
};

interface InputControlStateSpec<V extends ValueType> extends ValueNodeStateSpec<RuntimeValue<V>> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: null;
}

export class InputControl<V extends ValueType = ValueType>
	extends ValueNode<V, InputDefinition<V>, RuntimeValue<V>, RuntimeInputValue<V>>
	implements
		InputNode<V>,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSerializableValueNode
{
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: InputDefinition
	): AnyInputControl;
	static from<V extends ValueType>(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: InputDefinition<V>
	): InputControl<V> {
		return new this(parent, instanceNode, definition);
	}

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<InputControlStateSpec<V>>;
	protected readonly engineState: EngineState<InputControlStateSpec<V>>;

	// InputNode
	readonly nodeType = 'input';
	readonly appearances: InputNodeAppearances;
	readonly nodeOptions: InputNodeOptions<V>;
	readonly currentState: CurrentState<InputControlStateSpec<V>>;

	constructor(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: InputDefinition<V>
	) {
		const codec = getSharedValueCodec(definition.valueType);

		super(parent, instanceNode, definition, codec);

		this.appearances = definition.bodyElement.appearances;
		this.nodeOptions = nodeOptionsFactoryByType[definition.valueType](definition.bodyElement);

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
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
	}

	setValue(value: InputNodeInputValue<V>): Root {
		this.setValueState(value);

		return this.root;
	}
}

export type AnyInputControl =
	| InputControl<'barcode'>
	| InputControl<'binary'>
	| InputControl<'boolean'>
	| InputControl<'date'>
	| InputControl<'dateTime'>
	| InputControl<'decimal'>
	| InputControl<'geopoint'>
	| InputControl<'geoshape'>
	| InputControl<'geotrace'>
	| InputControl<'int'>
	| InputControl<'intent'>
	| InputControl<'string'>
	| InputControl<'time'>;
