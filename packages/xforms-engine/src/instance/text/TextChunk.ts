import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { TextChunk as ClientTextChunk, TextChunkSource } from '../../client/TextRange.ts';
import type { TranslationContext } from '../internal-api/TranslationContext.ts';

export class TextChunk implements ClientTextChunk {
	get language(): ActiveLanguage {
		return this.context.getActiveLanguage();
	}

	constructor(
		readonly context: TranslationContext,
		readonly source: TextChunkSource,
		readonly asString: string
	) {}
}
