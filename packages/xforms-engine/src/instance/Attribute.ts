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
import { createInstanceValueState } from '../lib/reactivity/createInstanceValueState.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import {
	createSharedNodeState,
	type SharedNodeState,
} from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { ReactiveScope } from '../lib/reactivity/scope.ts';
import type { SimpleAtomicState } from '../lib/reactivity/types.ts';
import type { AttributeDefinition } from '../parse/model/AttributeDefinition.ts';
import type { AnyChildNode, AnyNode } from './hierarchy.ts';
import type { AttributeContext } from './internal-api/AttributeContext.ts';
import type { DecodeInstanceValue } from './internal-api/InstanceValueContext.ts';
import type { ClientReactiveSerializableAttributeNode } from './internal-api/serialization/ClientReactiveSerializableAttributeNode.ts';
import type { PrimaryInstance } from './PrimaryInstance.ts';
import type { Root } from './Root.ts';

export interface AttributeStateSpec {
	readonly value: SimpleAtomicState<string>;
	readonly instanceValue: Accessor<string>;
	readonly relevant: Accessor<boolean>;
}

export class Attribute
	implements
		AttributeNode,
		ClientReactiveSerializableAttributeNode,
		AttributeContext,
		XFormsXPathAttribute
{
	readonly [XPathNodeKindKey] = 'attribute';

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
	readonly evaluator: EngineXPathEvaluator;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;
	readonly contextNode: AnyNode;
	readonly scope: ReactiveScope;
	readonly rootDocument: PrimaryInstance;

	readonly root: Root;

	readonly isRelevant: Accessor<boolean> = () => {
		return this.owner.isRelevant();
	};

	readonly isAttached: Accessor<boolean> = () => {
		return this.owner.isAttached();
	};

	readonly isReadonly: Accessor<boolean> = () => {
		return true;
	};

	readonly hasReadonlyAncestor: Accessor<boolean> = () => {
		const { owner } = this;
		return owner.hasReadonlyAncestor() || owner.isReadonly();
	};

	readonly hasNonRelevantAncestor: Accessor<boolean> = () => {
		const { owner } = this;
		return owner.hasNonRelevantAncestor() || !owner.isRelevant();
	};

	readonly contextReference = (): string => {
		return this.owner.contextReference() + '/@' + this.definition.qualifiedName.getPrefixedName();
	};

	constructor(
		readonly owner: AnyNode,
		readonly definition: AttributeDefinition,
		readonly instanceNode: StaticAttribute
	) {
		const codec = getSharedValueCodec('string');

		this.contextNode = owner;
		this.scope = owner.scope;
		this.rootDocument = owner.rootDocument;

		this.root = owner.root;

		this.getActiveLanguage = owner.getActiveLanguage;
		this.validationState = { violations: [] };

		this.valueType = 'string';
		this.evaluator = owner.evaluator;
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
			},
			owner.instanceConfig
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

	getXPathChildNodes(): readonly AnyChildNode[] {
		return [];
	}

	getXPathValue(): string {
		return '';
	}
}
