import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type {
	TextRange as ClientTextRange,
	TextChunk,
	TextOrigin,
	TextRole,
} from '../../client/TextRange.ts';
import { FormattedTextStub } from './FormattedTextStub.ts';

export interface MediaSources {
	image?: JRResourceURL;
	video?: JRResourceURL;
	audio?: JRResourceURL;
}

export class TextRange<Role extends TextRole, Origin extends TextOrigin>
	implements ClientTextRange<Role, Origin>
{
	*[Symbol.iterator]() {
		yield* this.chunks;
	}

	get formatted() {
		return FormattedTextStub;
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
		readonly origin: Origin,
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[],
		protected readonly mediaSources?: MediaSources
	) {}
}
