import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';

import type { MarkdownNode } from '../../client/MarkdownNode.ts';
import type { TextRange as ClientTextRange, TextChunk, TextRole } from '../../client/TextRange.ts';
import { format } from './markdownFormat.ts';

export interface MediaSources {
	image?: JRResourceURL;
	video?: JRResourceURL;
	audio?: JRResourceURL;
}

export class TextRange<Role extends TextRole> implements ClientTextRange<Role> {
	*[Symbol.iterator]() {
		yield* this.chunks;
	}

	get formatted(): MarkdownNode[] {
		return format(this.chunks);
	}

	get asString(): string {
		return this.chunks.map((chunk) => chunk.asString).join('');
	}

	get imageSource(): JRResourceURL | undefined {
		return this.mediaSources?.image;
	}

	get audioSource(): JRResourceURL | undefined {
		return this.mediaSources?.audio;
	}

	get videoSource(): JRResourceURL | undefined {
		return this.mediaSources?.video;
	}

	constructor(
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[],
		protected readonly mediaSources?: MediaSources
	) {}
}
