import type { AnyTextRangeDefinition } from '../text/abstract/TextRangeDefinition.ts';
import { TextChunkExpression } from './abstract/TextChunkExpression.ts';

export class TextReferenceExpression extends TextChunkExpression<'reference'> {
	static from(context: AnyTextRangeDefinition, refExpression: string): TextReferenceExpression {
		return new this(context, refExpression);
	}

	readonly source = 'reference';

	private constructor(context: AnyTextRangeDefinition, refExpression: string) {
		super(context, refExpression);
	}
}
