import type { Accessor } from 'solid-js';
import type { TextChunk } from '../../client/TextRange.ts';
import type { TranslationContext } from '../internal-api/TranslationContext.ts';
import { BaseTextChunk } from './BaseTextChunk.ts';

export class OutputTextChunk extends BaseTextChunk implements TextChunk {
	readonly source = 'output';

	get asString(): string {
		return this.getOutput();
	}

	constructor(
		context: TranslationContext,
		readonly getOutput: Accessor<string>
	) {
		super(context);
	}
}
