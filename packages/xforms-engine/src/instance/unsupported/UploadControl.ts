import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { TextRange } from '../../client/TextRange.ts';
import type { ValueType } from '../../client/ValueType.ts';
import type { UnsupportedControlNodeType } from '../../client/node-types.ts';
import type { UploadNode, UploadNodeDefinition } from '../../client/unsupported/UploadNode.ts';
import type { XFormsXPathElement } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type {
	TempUnsupportedInputValue,
	TempUnsupportedRuntimeValue,
} from '../../lib/codecs/TempUnsupportedControlCodec.ts';
import { TempUnsupportedControlCodec } from '../../lib/codecs/TempUnsupportedControlCodec.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../../lib/reactivity/text/createNodeLabel.ts';
import type { UnknownAppearanceDefinition } from '../../parse/body/appearance/unknownAppearanceParser.ts';
import { ValueNode, type ValueNodeStateSpec } from '../abstract/ValueNode.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { ValidationContext } from '../internal-api/ValidationContext.ts';
import type { ClientReactiveSerializableValueNode } from '../internal-api/serialization/ClientReactiveSerializableValueNode.ts';

interface UploadControlStateSpec extends ValueNodeStateSpec<TempUnsupportedRuntimeValue> {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: Accessor<TextRange<'hint'> | null>;
	readonly valueOptions: null;
}

const codecs = {
	string: new TempUnsupportedControlCodec('string'),
	int: new TempUnsupportedControlCodec('int'),
	decimal: new TempUnsupportedControlCodec('decimal'),
	boolean: new TempUnsupportedControlCodec('boolean'),
	date: new TempUnsupportedControlCodec('date'),
	time: new TempUnsupportedControlCodec('time'),
	dateTime: new TempUnsupportedControlCodec('dateTime'),
	geopoint: new TempUnsupportedControlCodec('geopoint'),
	geotrace: new TempUnsupportedControlCodec('geotrace'),
	geoshape: new TempUnsupportedControlCodec('geoshape'),
	binary: new TempUnsupportedControlCodec('binary'),
	barcode: new TempUnsupportedControlCodec('barcode'),
	intent: new TempUnsupportedControlCodec('intent'),
} as const;

class UnsupportedControlWriteError extends Error {
	constructor(type: UnsupportedControlNodeType) {
		super(`Cannot write state for node (type: ${type}) - not implemented`);
	}
}

export class UploadControl
	extends ValueNode<
		ValueType,
		UploadNodeDefinition,
		TempUnsupportedRuntimeValue,
		TempUnsupportedInputValue
	>
	implements
		UploadNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSerializableValueNode
{
	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<UploadControlStateSpec>;
	protected readonly engineState: EngineState<UploadControlStateSpec>;

	// UploadNode
	readonly nodeType = 'upload';
	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<UploadControlStateSpec>;

	constructor(parent: GeneralParentNode, definition: UploadNodeDefinition) {
		const codec = codecs[definition.valueType];

		super(parent, definition, codec);

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

	// UnsupportedControlNode
	setValue(_: never): never {
		throw new UnsupportedControlWriteError(this.nodeType);
	}
}
