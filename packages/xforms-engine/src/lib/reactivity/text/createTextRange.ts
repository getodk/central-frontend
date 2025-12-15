import {
	isResourceType,
	JRResourceURL,
	type JRResourceURLString,
	type ResourceType,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { isElementNode, isTextNode } from '@getodk/common/lib/dom/predicates.ts';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { TextRole } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { TextChunk } from '../../../instance/text/TextChunk.ts';
import { TextRange, type MediaSources } from '../../../instance/text/TextRange.ts';
import { TextChunkExpression } from '../../../parse/expression/TextChunkExpression.ts';
import type { TextRangeDefinition } from '../../../parse/text/abstract/TextRangeDefinition.ts';
import { createComputedExpression } from '../createComputedExpression.ts';

interface ChunksAndMedia {
	chunks: readonly TextChunk[];
	mediaSources: MediaSources;
}

const generateChunk = (node: Node): TextChunkExpression<'string'> | null => {
	if (isElementNode(node)) {
		return TextChunkExpression.fromOutput(node);
	}
	if (isTextNode(node)) {
		const formAttribute = node.parentElement!.getAttribute('form') as ResourceType;
		if (isResourceType(formAttribute)) {
			return TextChunkExpression.fromResource(node.data as JRResourceURLString, formAttribute);
		}
		return TextChunkExpression.fromLiteral(node.data);
	}
	return null;
};

const generateChunksForTranslation = (
	textElement: Element
): Array<TextChunkExpression<'string'>> => {
	const chunks = [];
	for (const child of textElement.childNodes) {
		for (const grandchild of child.childNodes) {
			const chunk = generateChunk(grandchild);
			if (chunk) {
				chunks.push(chunk);
			}
		}
	}
	return chunks;
};

const getChunkExpressions = <Role extends TextRole>(
	context: EvaluationContext,
	definition: TextRangeDefinition<Role>
): ReadonlyArray<TextChunkExpression<'string'>> => {
	if (definition.chunks[0]?.source !== 'translation') {
		// only translations have 'nodes' chunks
		return definition.chunks as Array<TextChunkExpression<'string'>>;
	}
	const itextId = context.evaluator.evaluateString(definition.chunks[0].toString()!, {
		contextNode: context.contextNode,
	});
	const lang = context.getActiveLanguage();
	const elem = definition.form.model.getItextElement(lang, itextId);
	return elem ? generateChunksForTranslation(elem) : [];
};

/**
 * Creates a reactive accessor for text chunks and an optional image from text source expressions.
 * - Combines chunks from literal and computed sources into a single array.
 * - Captures the first image found with a 'from="image"' attribute.
 *
 * @param context The evaluation context for reactive XPath computations.
 * @param definition The definition for the text range which contains chunks to transform
 * @returns An accessor for an object with all chunks and the first image (if any).
 */
const createTextChunks = <Role extends TextRole>(
	context: EvaluationContext,
	definition: TextRangeDefinition<Role>
): ChunksAndMedia => {
	const chunks: TextChunk[] = [];
	const mediaSources: MediaSources = {};
	const chunkExpressions = getChunkExpressions(context, definition);
	chunkExpressions.forEach((chunkExpression) => {
		if (chunkExpression.resourceType) {
			mediaSources[chunkExpression.resourceType] = JRResourceURL.from(
				chunkExpression.stringValue as JRResourceURLString
			);
			return;
		}

		if (chunkExpression.source === 'literal') {
			chunks.push(new TextChunk(context, chunkExpression.source, chunkExpression.stringValue));
			return;
		}

		const computed = createComputedExpression(context, chunkExpression)();
		chunks.push(new TextChunk(context, chunkExpression.source, computed));
	});
	return { chunks, mediaSources };
};

type ComputedFormTextRange<Role extends TextRole> = Accessor<TextRange<Role, 'form'>>;

/**
 * Creates a text range (e.g. label or hint) from the provided definition, reactive to:
 *
 * - The form's current language (e.g. `<label ref="jr:itext('text-id')" />`)
 * - Direct `<output>` references within the label's children
 */
export const createTextRange = <Role extends TextRole>(
	context: EvaluationContext,
	role: Role,
	definition: TextRangeDefinition<Role>
): ComputedFormTextRange<Role> => {
	return context.scope.runTask(() => {
		return createMemo(() => {
			const chunks = createTextChunks(context, definition);
			return new TextRange('form', role, chunks.chunks, chunks.mediaSources);
		});
	});
};
