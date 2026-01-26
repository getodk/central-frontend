import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { AttributeNode } from '../client/AttributeNode.ts';
import type { InstanceState, NullValidationState } from '../client/index.ts';
import type { XFormsXPathAttribute } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticAttribute } from '../integration/xpath/static-dom/StaticAttribute.ts';
import { createAttributeNodeInstanceState } from '../lib/client-reactivity/instance-state/createAttributeNodeInstanceState.ts';
import {
	getSharedValueCodec,
	type RuntimeInputValue,
	type RuntimeValue,
} from '../lib/codecs/getSharedValueCodec.ts';
import type { RuntimeValueSetter, RuntimeValueState } from '../lib/codecs/ValueCodec.ts';
import { createInstanceValueState } from '../lib/reactivity/createInstanceValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import {
	createSharedNodeState,
	type SharedNodeState,
} from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { AttributeDefinition } from '../parse/model/AttributeDefinition.ts';
import { DescendantNode, type DescendantNodeStateSpec } from './abstract/DescendantNode.ts';
import type { AnyNode } from './hierarchy.ts';
import type { AttributeContext } from './internal-api/AttributeContext.ts';
import type { DecodeInstanceValue } from './internal-api/InstanceValueContext.ts';
import type { ClientReactiveSerializableAttributeNode } from './internal-api/serialization/ClientReactiveSerializableAttributeNode.ts';
import type { Root } from './Root.ts';

export interface AttributeStateSpec extends DescendantNodeStateSpec<string> {
	readonly children: null;
	readonly value: SimpleAtomicState<string>;
	readonly instanceValue: Accessor<string>;
	readonly relevant: Accessor<boolean>;
}

export class Attribute
	extends DescendantNode<AttributeDefinition, AttributeStateSpec, AnyNode, null>
	implements
		AttributeNode,
		ClientReactiveSerializableAttributeNode,
		AttributeContext,
		XFormsXPathAttribute
{
	override readonly [XPathNodeKindKey] = 'attribute';

	protected readonly state: SharedNodeState<AttributeStateSpec>;
	protected readonly engineState: EngineState<AttributeStateSpec>;
	readonly validationState: NullValidationState;

	readonly nodeType = 'attribute';
	readonly currentState: CurrentState<AttributeStateSpec>;
	readonly instanceState: InstanceState;

	readonly appearances = null;
	readonly nodeOptions = null;

	readonly valueType: string;
	readonly decodeInstanceValue: DecodeInstanceValue;

	protected readonly getInstanceValue: Accessor<string>;
	protected readonly valueState: RuntimeValueState<RuntimeValue<'string'>>;
	protected readonly setValueState: RuntimeValueSetter<RuntimeInputValue<'string'>>;

	override readonly isAttached: Accessor<boolean> = () => {
		return this.owner.isAttached();
	};

	constructor(
		readonly owner: AnyNode,
		definition: AttributeDefinition,
		override readonly instanceNode: StaticAttribute
	) {
		const computeReference = () => {
			return `${this.owner.contextReference()}/@${this.definition.qualifiedName.getPrefixedName()}`;
		};

		super(owner, instanceNode, definition, { computeReference });

		const codec = getSharedValueCodec('string');

		this.validationState = { violations: [] };

		this.valueType = 'string';
		this.decodeInstanceValue = codec.decodeInstanceValue;

		const instanceValueState = createInstanceValueState(this);
		const valueState = codec.createRuntimeValueState(instanceValueState);

		const [getInstanceValue] = instanceValueState;
		const [, setValueState] = valueState;

		this.getInstanceValue = getInstanceValue;
		this.setValueState = setValueState;
		this.valueState = valueState;

		const state = createSharedNodeState(
			owner.scope,
			{
				value: this.valueState,
				instanceValue: this.getInstanceValue,
				relevant: this.owner.isRelevant,

				readonly: () => true,
				reference: this.contextReference,
				required: () => false,
				children: null,
				label: () => null,
				hint: () => null,
				attributes: () => [],
				valueOptions: () => [],
			},
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;
		this.instanceState = createAttributeNodeInstanceState(this);
	}

	setValue(value: string): Root {
		this.setValueState(value);

		return this.root;
	}

	getChildren(): readonly [] {
		return [];
	}
}
