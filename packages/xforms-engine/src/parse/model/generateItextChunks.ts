import {
	isResourceType,
	type JRResourceURLString,
	type ResourceType,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { isElementNode, isTextNode } from '@getodk/common/lib/dom/predicates.ts';
import { TextChunkExpression } from '../expression/TextChunkExpression.ts';
import type { DOMItextTranslationElement } from '../XFormDOM.ts';

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

const generateChunksForValues = (valueElement: ChildNode): Array<TextChunkExpression<'string'>> => {
	return Array.from(valueElement.childNodes)
		.map((node) => generateChunk(node))
		.filter((chunk) => chunk !== null);
};

const generateChunksForTranslation = (
	textElement: Element
): Array<TextChunkExpression<'string'>> => {
	return Array.from(textElement.childNodes).flatMap((valueElement) =>
		generateChunksForValues(valueElement)
	);
};

const generateChunksForLanguage = (
	translationElement: DOMItextTranslationElement
): Map<string, ReadonlyArray<TextChunkExpression<'string'>>> => {
	return new Map(
		Array.from(translationElement.children).map((textElement) => {
			const itextId = textElement.getAttribute('id');
			return [itextId!, generateChunksForTranslation(textElement)] as const;
		})
	);
};

export interface ChunkExpressionsByItextId
	extends Map<string, ReadonlyArray<TextChunkExpression<'string'>>> {}

export const generateItextChunks = (
	translationElements: readonly DOMItextTranslationElement[]
): Map<string, ChunkExpressionsByItextId> => {
	return new Map(
		translationElements.map((translationElement) => {
			const lang = translationElement.getAttribute('lang');
			return [lang, generateChunksForLanguage(translationElement)] as const;
		})
	);
};
