import type { TextChunk } from '../../client/TextRange.ts';
import type { TranslationContext } from '../internal-api/TranslationContext.ts';
import { BaseTextChunk } from './BaseTextChunk.ts';

export class StaticTextChunk extends BaseTextChunk implements TextChunk {
	readonly source = 'static';

	constructor(
		context: TranslationContext,
		readonly asString: string
	) {
		super(context);
	}
}
