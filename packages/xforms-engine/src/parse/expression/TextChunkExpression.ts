import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import { expressionParser } from '@getodk/xpath/expressionParser.js';
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

export class TextChunkExpression extends DependentExpression<'string'> {
	readonly source: TextChunkSource;
	// Set for the literal source, blank otherwise
	readonly stringValue: string;

	constructor(
		context: AnyTextRangeDefinition,
		expression: string,
		source: TextChunkSource,
		options: TextChunkExpressionOptions = {},
		literalValue = ''
	) {
		super(context, 'string', expression, {
			semanticDependencies: {
				translations: options.isTranslated,
			},
			ignoreContextReference: true,
		});

		this.source = source;
		this.stringValue = literalValue;
	}

	static fromLiteral(context: AnyTextRangeDefinition, stringValue: string): TextChunkExpression {
		return new TextChunkExpression(context, 'null', 'literal', {}, stringValue);
	}

	static fromReference(context: AnyTextRangeDefinition, ref: string): TextChunkExpression {
		return new TextChunkExpression(context, ref, 'reference');
	}

	static fromOutput(context: AnyTextRangeDefinition, element: Element): TextChunkExpression | null {
		if (!isOutputElement(element)) {
			return null;
		}

		return new TextChunkExpression(context, element.getAttribute('value'), 'output');
	}

	static fromTranslation(
		context: AnyTextRangeDefinition,
		maybeExpression: string
	): TextChunkExpression | null {
		try {
			expressionParser.parse(maybeExpression);
		} catch {
			return null;
		}

		if (isTranslationExpression(maybeExpression)) {
			return new TextChunkExpression(context, maybeExpression, 'translation', {
				isTranslated: true,
			});
		}

		return null;
	}
}
