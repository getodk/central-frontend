import { TextChunkDefinition } from './abstract/TextChunkDefinition.ts';
import type { AnyTextRangeDefinition } from './abstract/TextRangeDefinition.ts';

export type StaticTextChunkSourceNode = Attr | Text;

export class StaticTextChunkDefinition extends TextChunkDefinition<'static'> {
	static from(context: AnyTextRangeDefinition, stringValue: string): StaticTextChunkDefinition {
		return new this(context, stringValue);
	}

	readonly source = 'static';

	private constructor(
		context: AnyTextRangeDefinition,
		override readonly stringValue: string
	) {
		super(context, 'null');
	}
}
