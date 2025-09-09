import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import type { TextChunkSource } from '../../client/TextRange.ts';
import type { AnyTextRangeDefinition } from '../text/abstract/TextRangeDefinition.ts';
import { isTranslationExpression } from '../xpath/semantic-analysis.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

interface TextChunkExpressionOptions {
	readonly isTranslated?: true;
}

interface OutputElement extends KnownAttributeLocalNamedElement<'output', 'value'> {}

const isOutputElement = (element: Element): element is OutputElement => {
	return element.localName === 'output' && element.hasAttribute('value');
};

export class TextChunkExpression<T extends 'nodes' | 'string'> extends DependentExpression<T> {
	readonly source: TextChunkSource;
	// Set for the literal source, blank otherwise
	readonly stringValue: string;

	constructor(
		context: AnyTextRangeDefinition,
		resultType: T,
		expression: string,
		source: TextChunkSource,
		options: TextChunkExpressionOptions = {},
		literalValue = ''
	) {
		super(context, resultType, expression, {
			semanticDependencies: {
				translations: options.isTranslated,
			},
			ignoreContextReference: true,
		});

		this.source = source;
		this.stringValue = literalValue;
	}

	static fromLiteral(
		context: AnyTextRangeDefinition,
		stringValue: string
	): TextChunkExpression<'string'> {
		return new TextChunkExpression(context, 'string', 'null', 'literal', {}, stringValue);
	}

	static fromReference(
		context: AnyTextRangeDefinition,
		ref: string
	): TextChunkExpression<'string'> {
		return new TextChunkExpression(context, 'string', ref, 'reference');
	}

	static fromOutput(
		context: AnyTextRangeDefinition,
		element: Element
	): TextChunkExpression<'string'> | null {
		if (!isOutputElement(element)) {
			return null;
		}

		return new TextChunkExpression(context, 'string', element.getAttribute('value'), 'output');
	}

	static fromImage(
		context: AnyTextRangeDefinition,
		url: string
	): TextChunkExpression<'string'> {
		return new TextChunkExpression(context, 'string', 'null', 'image', {}, url);
	}

	static fromTranslation(
		context: AnyTextRangeDefinition,
		maybeExpression: string
	): TextChunkExpression<'nodes'> | null {
		if (isTranslationExpression(maybeExpression)) {
			return new TextChunkExpression(context, 'nodes', maybeExpression, 'translation', {
				isTranslated: true,
			});
		}

		return null;
	}
}
