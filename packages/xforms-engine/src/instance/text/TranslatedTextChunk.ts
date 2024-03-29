import type { Accessor } from 'solid-js';
import type { TextChunk } from '../../client/TextRange.ts';
import type { TranslationContext } from '../internal-api/TranslationContext.ts';
import { BaseTextChunk } from './BaseTextChunk.ts';

export class TranslatedTextChunk extends BaseTextChunk implements TextChunk {
	readonly source = 'itext';

	get asString(): string {
		return this.translate();
	}

	constructor(
		context: TranslationContext,
		readonly translate: Accessor<string>
	) {
		super(context);
	}
}
