import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { Accessor } from 'solid-js';
import type { TextRange } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import type { NoteTextDefinition } from '../../../parse/NoteNodeDefinition.ts';
import { createTextRange } from './createTextRange.ts';

// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type NoteTextRole = 'label' | 'hint';

export type ComputedNoteText<Role extends NoteTextRole = NoteTextRole> = Accessor<
	TextRange<Role, 'form'>
>;

interface BaseNoteText {
	readonly role: NoteTextRole;
	readonly label: ComputedNoteText<'label'> | null;
	readonly hint: ComputedNoteText<'hint'> | null;
}

interface LabelNoteText extends BaseNoteText {
	readonly role: 'label';
	readonly label: ComputedNoteText<'label'>;
	readonly hint: null;
}

interface HintNoteText extends BaseNoteText {
	readonly role: 'hint';
	readonly label: null;
	readonly hint: ComputedNoteText<'hint'>;
}

// prettier-ignore
export type NoteTextComputation =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| LabelNoteText
	| HintNoteText;

export const createNoteText = (
	context: EvaluationContext,
	noteTextDefinition: NoteTextDefinition
): NoteTextComputation => {
	const { scope } = context;
	const { role } = noteTextDefinition;

	return scope.runTask(() => {
		switch (role) {
			case 'label': {
				const label = createTextRange(context, role, noteTextDefinition);

				return {
					role,
					label,
					hint: null,
				};
			}

			case 'hint': {
				const hint = createTextRange(context, role, noteTextDefinition);

				return {
					role,
					label: null,
					hint,
				};
			}

			default:
				throw new UnreachableError(noteTextDefinition);
		}
	});
};
