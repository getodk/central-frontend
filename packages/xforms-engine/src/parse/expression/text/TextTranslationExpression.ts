import { expressionParser } from '@getodk/xpath/expressionParser.js';
import type { AnyTextRangeDefinition } from '../../text/abstract/TextRangeDefinition.ts';
import type { TranslationExpression } from '../../xpath/semantic-analysis.ts';
import { isTranslationExpression } from '../../xpath/semantic-analysis.ts';
import { TextChunkExpression } from './TextChunkExpression.ts';

export class TextTranslationExpression extends TextChunkExpression<'translation'> {
	static fromMessage(
		context: AnyTextRangeDefinition,
		maybeExpression: string
	): TextTranslationExpression | null {
		try {
			expressionParser.parse(maybeExpression);
		} catch {
			return null;
		}

		if (isTranslationExpression(maybeExpression)) {
			return new this(context, maybeExpression);
		}

		return null;
	}

	static from(context: AnyTextRangeDefinition, maybeExpression: string) {
		if (isTranslationExpression(maybeExpression)) {
			return new this(context, maybeExpression);
		}

		return null;
	}

	readonly source = 'translation';

	private constructor(context: AnyTextRangeDefinition, expression: TranslationExpression) {
		super(context, expression, { isTranslated: true });
	}
}
