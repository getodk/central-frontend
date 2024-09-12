import type { AnyTextRangeDefinition } from '../text/abstract/TextRangeDefinition.ts';
import { TextChunkExpression } from './abstract/TextChunkExpression.ts';

export type TextLiteralSourceNode = Attr | Text;

export class TextLiteralExpression extends TextChunkExpression<'literal'> {
	static from(context: AnyTextRangeDefinition, stringValue: string): TextLiteralExpression {
		return new this(context, stringValue);
	}

	readonly source = 'literal';

	private constructor(
		context: AnyTextRangeDefinition,
		override readonly stringValue: string
	) {
		super(context, 'null');
	}
}
