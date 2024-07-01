import { isItextFunctionCalled } from '../../lib/xpath/analysis.ts';
import { TextChunkDefinition } from './abstract/TextChunkDefinition.ts';
import type { AnyTextRangeDefinition } from './abstract/TextRangeDefinition.ts';

type TranslationExpression = `jr:itext(${string})`;

const isTranslationExpression = (value: string): value is TranslationExpression => {
	try {
		return isItextFunctionCalled(value);
	} catch {
		return false;
	}
};

export class TranslationChunkDefinition extends TextChunkDefinition<'translation'> {
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
