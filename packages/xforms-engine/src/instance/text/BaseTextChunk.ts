import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { TextChunk } from '../../client/TextRange.ts';
import type { TranslationContext } from '../internal-api/TranslationContext.ts';

export abstract class BaseTextChunk implements TextChunk {
	get formatted() {
		throw new Error('Not implemented');
	}

	get language(): ActiveLanguage {
		return this.context.activeLanguage;
	}

	abstract readonly source: TextChunk['source'];
	abstract get asString(): string;

	constructor(readonly context: TranslationContext) {}
}
