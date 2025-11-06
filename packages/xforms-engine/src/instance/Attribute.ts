import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { AttributeNode } from '../client/AttributeNode.ts';
import type { ActiveLanguage, InstanceState, NullValidationState } from '../client/index.ts';
import type { XFormsXPathAttribute } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { EngineXPathEvaluator } from '../integration/xpath/EngineXPathEvaluator.ts';
import type { StaticAttribute } from '../integration/xpath/static-dom/StaticAttribute.ts';
import { createAttributeNodeInstanceState } from '../lib/client-reactivity/instance-state/createAttributeNodeInstanceState.ts';
import {
	getSharedValueCodec,
	type RuntimeInputValue,
	type RuntimeValue,
} from '../lib/codecs/getSharedValueCodec.ts';
import type { RuntimeValueSetter, RuntimeValueState } from '../lib/codecs/ValueCodec.ts';
import { createAttributeValueState } from '../lib/reactivity/createAttributeValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import {
	createSharedNodeState,
	type SharedNodeState,
} from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { AttributeDefinition } from '../parse/model/AttributeDefinition.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import type { AnyParentNode } from './hierarchy.ts';
import type { AttributeContext } from './internal-api/AttributeContext.ts';
import type { DecodeInstanceValue } from './internal-api/InstanceValueContext.ts';
import type { ClientReactiveSerializableAttributeNode } from './internal-api/serialization/ClientReactiveSerializableAttributeNode.ts';
import type { Root } from './Root.ts';

export interface AttributeStateSpec extends DescendantNodeSharedStateSpec {
	readonly children: null;
	readonly attributes: null;
	readonly value: SimpleAtomicState<string>;
	readonly instanceValue: Accessor<string>;
	readonly label: null;
	readonly hint: null;
	readonly valueOptions: null;
}

export class Attribute
	extends InstanceNode<AttributeDefinition, AttributeStateSpec, AnyParentNode, null>
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
	override readonly instanceState: InstanceState;

	readonly appearances = null;
	readonly nodeOptions = null;

	readonly valueType: string;
	readonly decodeInstanceValue: DecodeInstanceValue;

	protected readonly getInstanceValue: Accessor<string>;
	protected readonly valueState: RuntimeValueState<RuntimeValue<'string'>>;
	protected readonly setValueState: RuntimeValueSetter<RuntimeInputValue<'string'>>;
	readonly evaluator: EngineXPathEvaluator;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	override readonly root: Root;

	readonly isRelevant: Accessor<boolean> = () => {
		return this.parent.isRelevant();
	};

	readonly isAttached: Accessor<boolean> = () => {
		return this.parent.isAttached();
	};

	readonly isReadonly: Accessor<boolean> = () => {
		return true;
	};

	readonly hasReadonlyAncestor: Accessor<boolean> = () => {
		const { parent } = this;
		return parent.hasReadonlyAncestor() || parent.isReadonly();
	};

	readonly hasNonRelevantAncestor: Accessor<boolean> = () => {
		const { parent } = this;
		return parent.hasNonRelevantAncestor() || !parent.isRelevant();
	};

	constructor(
		parent: AnyParentNode,
		definition: AttributeDefinition,
		override readonly instanceNode: StaticAttribute
	) {
		const codec = getSharedValueCodec('string');

		super(parent.instanceConfig, parent, instanceNode, definition, {
			scope: parent.scope,
			computeReference: (): string => '@' + this.definition.qualifiedName.getPrefixedName(),
		});

		this.root = parent.root;

		this.getActiveLanguage = parent.getActiveLanguage;
		this.validationState = { violations: [] };

		this.valueType = 'string';
		this.evaluator = parent.evaluator;
		this.decodeInstanceValue = codec.decodeInstanceValue;

		const instanceValueState = createAttributeValueState(this);
		const valueState = codec.createRuntimeValueState(instanceValueState);

		const [getInstanceValue] = instanceValueState;
		const [, setValueState] = valueState;

		this.getInstanceValue = getInstanceValue;
		this.setValueState = setValueState;
		this.getXPathValue = () => {
			return this.getInstanceValue();
		};
		this.valueState = valueState;

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: this.isReadonly,
				relevant: this.isRelevant,
				required: () => false,

				label: null,
				hint: null,
				children: null,
				valueOptions: null,
				value: this.valueState,
				instanceValue: this.getInstanceValue,
				attributes: null,
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
