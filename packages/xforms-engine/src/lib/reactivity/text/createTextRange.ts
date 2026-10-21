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
import {
  isTextForm,
  TextChunkExpression,
  type TextForm,
} from '../../../parse/expression/TextChunkExpression.ts';
import type { TextRangeDefinition } from '../../../parse/text/abstract/TextRangeDefinition.ts';
import { evaluateExpression } from '../createComputedExpression.ts';

interface ChunksAndMedia {
  chunks: readonly TextChunk[];
  guidanceChunks: readonly TextChunk[];
  mediaSources: MediaSources;
  error: Error | null;
}

const computeChunk = (
  context: EvaluationContext,
  expression: TextChunkExpression<'string'>,
  errors: Error[]
): string => {
  const { value, error } = evaluateExpression(context, expression);
  if (error) {
    errors.push(error);
  }
  return value!;
};

const computeItextId = (context: EvaluationContext, expression: string, errors: Error[]) => {
  const result = context.evaluator.evaluateString(expression, { contextNode: context.contextNode });
  if (result.error) {
    errors.push(result.error);
    return null;
  }
  return result.value;
};

const generateResourceChunk = (
  context: EvaluationContext,
  child: Element,
  type: ResourceType,
  errors: Error[]
) => {
  const parts = [];
  for (const grandchild of child.childNodes) {
    if (isElementNode(grandchild)) {
      const expression = TextChunkExpression.fromOutput(grandchild);
      if (expression) {
        parts.push(computeChunk(context, expression, errors));
      }
    } else if (isTextNode(grandchild)) {
      parts.push(grandchild.data);
    }
  }
  const url = parts.join('') as JRResourceURLString;
  return TextChunkExpression.fromResource(url, type);
};

const generateChunk = (node: Node, textForm?: TextForm): TextChunkExpression<'string'> | null => {
  if (isElementNode(node)) {
    return TextChunkExpression.fromOutput(node, textForm);
  }
  if (isTextNode(node)) {
    return TextChunkExpression.fromLiteral(node.data, textForm);
  }
  return null;
};

const generateChunksForTranslation = (
  context: EvaluationContext,
  textElement: Element,
  errors: Error[]
): Array<TextChunkExpression<'string'>> => {
  const chunks = [];
  for (const child of textElement.children) {
    const formAttribute = child.getAttribute('form');

    if (formAttribute && isResourceType(formAttribute)) {
      chunks.push(generateResourceChunk(context, child, formAttribute, errors));
    } else {
      const textForm = formAttribute && isTextForm(formAttribute) ? formAttribute : undefined;
      for (const grandchild of child.childNodes) {
        const chunk = generateChunk(grandchild, textForm);
        if (chunk) {
          chunks.push(chunk);
        }
      }
    }
  }
  return chunks;
};

const getChunkExpressions = <Role extends TextRole>(
  context: EvaluationContext,
  definition: TextRangeDefinition<Role>,
  errors: Error[]
): ReadonlyArray<TextChunkExpression<'string'>> => {
  if (definition.chunks[0]?.source !== 'translation') {
    // only translations have 'nodes' chunks
    return definition.chunks as Array<TextChunkExpression<'string'>>;
  }
  const itextId = computeItextId(context, definition.chunks[0].toString()!, errors);
  if (itextId == null) {
    return [];
  }
  const lang = context.getActiveLanguage();
  const elem = definition.form.model.getItextElement(lang, itextId);
  return elem ? generateChunksForTranslation(context, elem, errors) : [];
};

const createChunk = (
  context: EvaluationContext,
  chunkExpression: TextChunkExpression<'string'>,
  errors: Error[]
) => {
  if (chunkExpression.source === 'literal') {
    return new TextChunk(context, chunkExpression.source, chunkExpression.stringValue);
  }
  const computed = computeChunk(context, chunkExpression, errors);
  return new TextChunk(context, chunkExpression.source, computed);
};

/**
 * Creates a reactive accessor for text chunks and an optional image, audio and video from text source expressions.
 * - Combines chunks from literal and computed sources into a main array and a guidance array.
 * - Captures the first image found with a 'from=<"image"|"audio"|"video">' attribute.
 *
 * @param context The evaluation context for reactive XPath computations.
 * @param definition The definition for the text range which contains chunks to transform
 * @returns An accessor for an object with the main chunks, the guidance chunks and the first image, audio and video (if any).
 */
const createTextChunks = <Role extends TextRole>(
  context: EvaluationContext,
  definition: TextRangeDefinition<Role>
): ChunksAndMedia => {
  const chunks: TextChunk[] = [];
  const guidanceChunks: TextChunk[] = [];
  const mediaSources: MediaSources = {};
  const errors: Error[] = [];
  const chunkExpressions = getChunkExpressions(context, definition, errors);
  chunkExpressions.forEach((chunkExpression) => {
    if (chunkExpression.resourceType) {
      const url = chunkExpression.stringValue?.trim();
      if (JRResourceURL.isJRResourceReference(url)) {
        mediaSources[chunkExpression.resourceType] = JRResourceURL.from(url);
      }
      return;
    }

    const chunk = createChunk(context, chunkExpression, errors);
    if (chunkExpression.textForm === 'guidance') {
      guidanceChunks.push(chunk);
    } else {
      chunks.push(chunk);
    }
  });

  return { chunks, guidanceChunks, mediaSources, error: errors[0] ?? null };
};

type ComputedFormTextRange<Role extends TextRole> = Accessor<TextRange<Role>>;

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
      const { chunks, guidanceChunks, mediaSources, error } = createTextChunks(context, definition);
      return new TextRange(role, chunks, guidanceChunks, mediaSources, error);
    });
  });
};
