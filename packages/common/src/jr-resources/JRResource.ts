import type { XFormAttachmentFixture } from '../fixtures/xform-attachments.ts';
import { JRResourceURL } from './JRResourceURL.ts';

type JRResourceLoader = (this: void) => Promise<string>;

export interface JRResourceSource {
	readonly url: JRResourceURL;
	readonly fileName: string;
	readonly mimeType: string;
	readonly load: JRResourceLoader;
}

export class JRResource {
	static fromFormAttachmentFixture(category: string, fixture: XFormAttachmentFixture): JRResource {
		const { fileName, mimeType, load } = fixture;
		const url = JRResourceURL.create(category, fileName);

		return new JRResource({
			url,
			fileName,
			mimeType,
			load,
		});
	}

	readonly url: JRResourceURL;
	readonly fileName: string;
	readonly mimeType: string;
	readonly load: JRResourceLoader;

	constructor(source: JRResourceSource) {
		const { url, fileName, mimeType, load } = source;

		this.url = url;
		this.fileName = fileName;
		this.mimeType = mimeType;
		this.load = load;
	}
}
