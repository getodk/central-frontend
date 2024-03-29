import { type Accessor } from 'solid-js';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { TextRange } from '../../../instance/text/TextRange.ts';
import type { AnyNodeDefinition } from '../../../model/NodeDefinition.ts';
import { createTextRange } from './createTextRange.ts';

export const createNodeLabel = (
	context: EvaluationContext,
	definition: AnyNodeDefinition
): Accessor<TextRange<'label'> | null> => {
	const labelDefinition = definition.bodyElement?.label ?? null;

	return createTextRange(context, 'label', labelDefinition, {
		fallbackValue: null,
	});
};
