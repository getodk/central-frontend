import type {
	JRResourceURLString,
	ResourceType,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import type { TextChunkSource } from '../../client/TextRange.ts';
import { getTranslationExpression } from '../xpath/semantic-analysis.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

interface TextChunkExpressionOptions {
	readonly type?: ResourceType;
}

interface OutputElement extends KnownAttributeLocalNamedElement<'output', 'value'> {}

const isOutputElement = (element: Element): element is OutputElement => {
	return element.localName === 'output' && element.hasAttribute('value');
};

export class TextChunkExpression<T extends 'nodes' | 'string'> extends DependentExpression<T> {
	readonly source: TextChunkSource;
	// Set for the literal source, blank otherwise
	readonly stringValue: string;
	readonly resourceType: ResourceType | null;

	constructor(
		resultType: T,
		expression: string,
		source: TextChunkSource,
		literalValue = '',
		options: TextChunkExpressionOptions = {}
	) {
		super(resultType, expression);

		this.resourceType = options.type ?? null;
		this.source = source;
		this.stringValue = literalValue;
	}

	static fromLiteral(stringValue: string): TextChunkExpression<'string'> {
		return new TextChunkExpression('string', 'null', 'literal', stringValue);
	}

	static fromReference(ref: string): TextChunkExpression<'string'> {
		return new TextChunkExpression('string', ref, 'reference');
	}

	static fromOutput(element: Element): TextChunkExpression<'string'> | null {
		if (!isOutputElement(element)) {
			return null;
		}

		return new TextChunkExpression('string', element.getAttribute('value'), 'output');
	}

	static fromResource(url: JRResourceURLString, type: ResourceType): TextChunkExpression<'string'> {
		return new TextChunkExpression('string', 'null', 'literal', url, { type });
	}

	static fromTranslation(maybeExpression: string): TextChunkExpression<'nodes'> | null {
		const translationExpression = getTranslationExpression(maybeExpression);
		if (translationExpression) {
			return new TextChunkExpression('nodes', translationExpression, 'translation');
		}

		return null;
	}
}
