import { type Accessor } from 'solid-js';
import type { TextRange } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import type { AnyNodeDefinition } from '../../../model/NodeDefinition.ts';
import { createTextRange } from './createTextRange.ts';

export const createNodeLabel = (
	context: EvaluationContext,
	definition: AnyNodeDefinition
): Accessor<TextRange<'label', 'form'> | null> => {
	const labelDefinition = definition.bodyElement?.label ?? null;

	if (labelDefinition == null) {
		return () => null;
	}

	return createTextRange(context, 'label', labelDefinition);
};
