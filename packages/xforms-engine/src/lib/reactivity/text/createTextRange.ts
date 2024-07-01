import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { TextChunkSource, TextRole } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { TextChunk } from '../../../instance/text/TextChunk.ts';
import { TextRange } from '../../../instance/text/TextRange.ts';
import type { AnyTextChunkDefinition } from '../../../parse/text/abstract/TextChunkDefinition.ts';
import type { TextRangeDefinition } from '../../../parse/text/abstract/TextRangeDefinition.ts';
import { createComputedExpression } from '../createComputedExpression.ts';

interface TextChunkComputation {
	readonly source: TextChunkSource;
	readonly getText: Accessor<string>;
}

const createComputedTextChunk = (
	context: EvaluationContext,
	textSource: AnyTextChunkDefinition
): TextChunkComputation => {
	const { source } = textSource;

	if (source === 'static') {
		const { stringValue } = textSource;

		return {
			source,
			getText: () => stringValue,
		};
	}

	return context.scope.runTask(() => {
		const getText = createComputedExpression(context, textSource);

		return {
			source,
			getText,
		};
	});
};

const createTextChunks = (
	context: EvaluationContext,
	textSources: readonly AnyTextChunkDefinition[]
): Accessor<readonly TextChunk[]> => {
	return context.scope.runTask(() => {
		const { root } = context;
		const chunkComputations = textSources.map((textSource) => {
			return createComputedTextChunk(context, textSource);
		});

		return createMemo(() => {
			return chunkComputations.map(({ source, getText }) => {
				return new TextChunk(root, source, getText());
			});
		});
	});
};

type ComputedFormTextRange<Role extends TextRole> = Accessor<TextRange<Role, 'form'>>;

/**
 * Creates a text range (e.g. label or hint) from the provided definition,
 * reactive to:
 *
 * - The form's current language (e.g. `<label ref="jr:itext('text-id')" />`)
 * - Direct `<output>` references within the label's children
 *
 * @todo This does not yet handle itext translations **with** outputs!
 */
export const createTextRange = <Role extends TextRole>(
	context: EvaluationContext,
	role: Role,
	definition: TextRangeDefinition<Role>
): ComputedFormTextRange<Role> => {
	return context.scope.runTask(() => {
		const getTextChunks = createTextChunks(context, definition.chunks);

		return createMemo(() => {
			return new TextRange('form', role, getTextChunks());
		});
	});
};
