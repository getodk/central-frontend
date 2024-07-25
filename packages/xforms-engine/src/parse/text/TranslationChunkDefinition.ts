import { expressionParser } from '@getodk/xpath/expressionParser.js';
import type { TranslationExpression } from '../xpath/semantic-analysis.ts';
import { isTranslationExpression } from '../xpath/semantic-analysis.ts';
import { TextChunkDefinition } from './abstract/TextChunkDefinition.ts';
import type { AnyTextRangeDefinition } from './abstract/TextRangeDefinition.ts';

export class TranslationChunkDefinition extends TextChunkDefinition<'translation'> {
	static fromMessage(
		context: AnyTextRangeDefinition,
		maybeExpression: string
	): TranslationChunkDefinition | null {
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
