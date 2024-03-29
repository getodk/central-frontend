import { type Accessor } from 'solid-js';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { TextRange } from '../../../instance/text/TextRange.ts';
import type { ValueNodeDefinition } from '../../../model/ValueNodeDefinition.ts';
import { createTextRange } from './createTextRange.ts';

export const createFieldHint = (
	context: EvaluationContext,
	definition: ValueNodeDefinition
): Accessor<TextRange<'hint'> | null> => {
	const hintDefinition = definition.bodyElement?.hint ?? null;

	return createTextRange(context, 'hint', hintDefinition, {
		fallbackValue: null,
	});
};
