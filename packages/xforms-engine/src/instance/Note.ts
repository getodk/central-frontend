import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { NoteNode, NoteNodeAppearances, NoteValue } from '../client/NoteNode.ts';
import type { TextRange } from '../client/TextRange.ts';
import type { ValueType } from '../client/ValueType.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { getNoteCodec } from '../lib/codecs/getNoteCodec.ts';
import type { NoteInputValue, NoteRuntimeValue } from '../lib/codecs/NoteCodec.ts';
import { createNoteReadonlyThunk } from '../lib/reactivity/createNoteReadonlyThunk.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createFieldHint } from '../lib/reactivity/text/createFieldHint.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import { createNoteText, type ComputedNoteText } from '../lib/reactivity/text/createNoteText.ts';
import type { NoteNodeDefinition } from '../parse/model/NoteNodeDefinition.ts';
import { ValueNode, type ValueNodeStateSpec } from './abstract/ValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableValueNode } from './internal-api/submission/ClientReactiveSubmittableValueNode.ts';
import type { ValidationContext } from './internal-api/ValidationContext.ts';

interface NoteStateSpec<V extends ValueType> extends ValueNodeStateSpec<NoteValue<V>> {
	readonly readonly: Accessor<true>;
	readonly noteText: ComputedNoteText;
	readonly label: Accessor<TextRange<'label', 'form'> | null>;
	readonly hint: Accessor<TextRange<'hint', 'form'> | null>;
	readonly valueOptions: null;
}

export class Note<V extends ValueType = ValueType>
	extends ValueNode<V, NoteNodeDefinition<V>, NoteRuntimeValue<V>, NoteInputValue<V>>
	implements
		NoteNode,
		XFormsXPathElement,
		EvaluationContext,
		ValidationContext,
		ClientReactiveSubmittableValueNode
{
	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<NoteStateSpec<V>>;
	protected readonly engineState: EngineState<NoteStateSpec<V>>;

	// NoteNode
	readonly nodeType = 'note';
	readonly appearances: NoteNodeAppearances;
	readonly nodeOptions = null;
	readonly currentState: CurrentState<NoteStateSpec<V>>;

	constructor(parent: GeneralParentNode, definition: NoteNodeDefinition<V>) {
		const codec = getNoteCodec(definition.valueType);

		super(parent, definition, codec);

		this.appearances = definition.bodyElement.appearances;

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const isReadonly = createNoteReadonlyThunk(this, definition);
		const noteTextComputation = createNoteText(this, definition.noteTextDefinition);

		let noteText: ComputedNoteText;
		let label: Accessor<TextRange<'label', 'form'> | null>;
		let hint: Accessor<TextRange<'hint', 'form'> | null>;

		switch (noteTextComputation.role) {
			case 'label': {
				noteText = noteTextComputation.label;
				label = noteTextComputation.label;
				hint = createFieldHint(this, definition);

				break;
			}

			case 'hint': {
				noteText = noteTextComputation.hint;
				label = createNodeLabel(this, definition);
				hint = noteTextComputation.hint;

				break;
			}

			default:
				throw new UnreachableError(noteTextComputation);
		}

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: isReadonly,
				relevant: this.isRelevant,
				required: this.isRequired,

				label,
				hint,
				noteText,

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
}

export type AnyNote =
	| Note<'barcode'>
	| Note<'binary'>
	| Note<'boolean'>
	| Note<'date'>
	| Note<'dateTime'>
	| Note<'decimal'>
	| Note<'geopoint'>
	| Note<'geoshape'>
	| Note<'geotrace'>
	| Note<'int'>
	| Note<'intent'>
	| Note<'string'>
	| Note<'time'>;
