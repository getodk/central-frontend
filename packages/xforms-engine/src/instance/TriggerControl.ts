import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { TextRange } from '../client/TextRange.ts';
import type { TriggerNode, TriggerNodeDefinition } from '../client/TriggerNode.ts';
import type { ValueType } from '../client/ValueType.ts';
import { ErrorProductionDesignPendingError } from '../error/ErrorProductionDesignPendingError.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticLeafElement } from '../integration/xpath/static-dom/StaticElement.ts';
import type { TriggerInputValue, TriggerRuntimeValue } from '../lib/codecs/TriggerCodec.ts';
import { TriggerCodec } from '../lib/codecs/TriggerCodec.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { Root } from './Root.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from './internal-api/serialization/ClientReactiveSerializableValueNode.ts';

interface TriggerControlStateSpec extends ValueNodeStateSpec<TriggerRuntimeValue> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: null;
}

type AnyTriggerNodeDefinition = {
	[V in ValueType]: TriggerNodeDefinition<V>;
}[ValueType];

const codec = new TriggerCodec();

export class TriggerControl
	extends ValueNode<
		'string',
		TriggerNodeDefinition<'string'>,
		TriggerRuntimeValue,
		TriggerInputValue
	>
	implements
		TriggerNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSerializableValueNode
{
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: TriggerNodeDefinition
	): TriggerControl;
	static from(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: AnyTriggerNodeDefinition
	): TriggerControl {
		if (definition.valueType !== 'string') {
			throw new ErrorProductionDesignPendingError(
				`Unsupported trigger value type: ${definition.valueType}`
			);
		}

		return new this(parent, instanceNode, definition);
	}

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<TriggerControlStateSpec>;
	protected readonly engineState: EngineState<TriggerControlStateSpec>;

	// TriggerNode
	readonly nodeType = 'trigger';
	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<TriggerControlStateSpec>;

	private constructor(
		parent: GeneralParentNode,
		instanceNode: StaticLeafElement | null,
		definition: TriggerNodeDefinition<'string'>
	) {
		super(parent, instanceNode, definition, codec);

		this.appearances = definition.bodyElement.appearances;

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

	// TriggerNode
	setValue(value: TriggerInputValue): Root {
		this.setValueState(value);

		return this.root;
	}
}
