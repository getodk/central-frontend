import { TextChunkDefinition } from './abstract/TextChunkDefinition.ts';
import type { AnyTextRangeDefinition } from './abstract/TextRangeDefinition.ts';

export class ReferenceChunkDefinition extends TextChunkDefinition<'reference'> {
	static from(context: AnyTextRangeDefinition, refExpression: string): ReferenceChunkDefinition {
		return new this(context, refExpression);
	}

	readonly source = 'reference';

	private constructor(context: AnyTextRangeDefinition, refExpression: string) {
		super(context, refExpression);
	}
}
