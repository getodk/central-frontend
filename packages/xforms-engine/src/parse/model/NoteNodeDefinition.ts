import type { NoteNode } from '../../client/NoteNode.ts';
import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { InputControlDefinition } from '../body/control/InputControlDefinition.ts';
import { BindComputationExpression } from '../expression/BindComputationExpression.ts';
import type { ConstantTruthyDependentExpression } from '../expression/abstract/DependentExpression.ts';
import type { HintDefinition } from '../text/HintDefinition.ts';
import type { LabelDefinition } from '../text/LabelDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { ParentNodeDefinition } from './NodeDefinition.ts';

// prettier-ignore
export type NoteReadonlyDefinition =
	&	BindComputationExpression<'readonly'>
	& ConstantTruthyDependentExpression;

export interface NoteBindDefinition extends BindDefinition {
	readonly readonly: NoteReadonlyDefinition;
}

const isNoteBindDefinition = (bind: BindDefinition): bind is NoteBindDefinition => {
	return bind.readonly.isConstantTruthyExpression();
};

// prettier-ignore
export type NoteTextDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| LabelDefinition
	| HintDefinition;

/**
 * @package This class is used internally, both in static types and at runtime,
 * to guard and guide the distinction between instance state nodes for 'note'
 * and 'string' node types. It is intentionally package-private! The less
 * specific {@link NoteNode.definition} type, if it has any client value at all,
 * should be more than sufficient. Clients are otherwise expected to use other
 * aspects of the node's interface (such as its {@link NoteNode.nodeType} and
 * distinct {@link NoteNode.currentState} types) to handle note-specific logic.
 */
export class NoteNodeDefinition extends LeafNodeDefinition {
	static from(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: AnyBodyElementDefinition | null,
		node: Element
	): NoteNodeDefinition | null {
		if (!isNoteBindDefinition(bind) || bodyElement?.type !== 'input') {
			return null;
		}

		const { label, hint } = bodyElement;
		const noteTextDefinition = label ?? hint;

		if (noteTextDefinition == null) {
			return null;
		}

		return new this(parent, bind, bodyElement, noteTextDefinition, node);
	}

	constructor(
		parent: ParentNodeDefinition,
		override readonly bind: NoteBindDefinition,
		override readonly bodyElement: InputControlDefinition,
		readonly noteTextDefinition: NoteTextDefinition,
		node: Element
	) {
		super(parent, bind, bodyElement, node);
	}
}
