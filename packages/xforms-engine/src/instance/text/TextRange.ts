import type { TextRange as ClientTextRange, TextChunk } from '../../client/TextRange.ts';

export type TextRole = 'hint' | 'label';

export class TextRange<Role extends TextRole> implements ClientTextRange<Role> {
	*[Symbol.iterator]() {
		yield* this.chunks;
	}

	get formatted() {
		throw new Error('Not implemented');
	}

	get asString(): string {
		return this.chunks.map((chunk) => chunk.asString).join('');
	}

	constructor(
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[]
	) {}
}
