import { type Accessor } from 'solid-js';
import type { TextRange } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import type { LeafNodeDefinition } from '../../../model/LeafNodeDefinition.ts';
import { createTextRange } from './createTextRange.ts';

export const createFieldHint = (
	context: EvaluationContext,
	definition: LeafNodeDefinition
): Accessor<TextRange<'hint', 'form'> | null> => {
	const hintDefinition = definition.bodyElement?.hint ?? null;

	if (hintDefinition == null) {
		return () => null;
	}

	return createTextRange(context, 'hint', hintDefinition);
};
