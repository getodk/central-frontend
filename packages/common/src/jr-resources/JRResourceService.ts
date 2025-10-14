import { xformAttachmentFixturesByDirectory } from '../fixtures/xform-attachments.ts';
import { JRResource } from './JRResource.ts';
import type { JRResourceURLString } from './JRResourceURL.ts';
import { JRResourceURL } from './JRResourceURL.ts';

export interface InlineFixtureMetadata {
	readonly url: JRResourceURLString;
	readonly fileName: string;
	readonly mimeType: string;
}

class JRResourceServiceRegistry extends Map<JRResourceURLString, JRResource> {}

interface ActivateFixturesOptions {
	readonly suppressMissingFixturesDirectoryWarning?: boolean;
}

export class JRResourceService {
	readonly resources = new JRResourceServiceRegistry();

	readonly handleRequest = async (url: JRResourceURL | JRResourceURLString): Promise<Response> => {
		let resourceKey: JRResourceURLString;

		if (typeof url === 'string') {
			resourceKey = url;
		} else {
			resourceKey = url.href;
		}

		const resource = this.resources.get(resourceKey);

		if (resource == null) {
			return new Response('Not found', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' },
			});
		}

		const { load, mimeType } = resource;
		const body = await load();

		return new Response(body, {
			status: 200,
			headers: { 'Content-Type': mimeType },
		});
	};

	private setRegisteredResourceState(resource: JRResource) {
		const url = resource.url.href;

		if (this.resources.has(url)) {
			throw new Error(`Resource already registered for URL: ${url}`);
		}

		this.resources.set(url, resource);
	}

	activateFixtures(
		fixtureDirectory: string,
		categories: readonly string[],
		options?: ActivateFixturesOptions
	): void {
		this.reset();

		try {
			for (const category of categories) {
				const fixtures = xformAttachmentFixturesByDirectory.get(fixtureDirectory);

				if (fixtures == null) {
					if (options?.suppressMissingFixturesDirectoryWarning !== true) {
						// eslint-disable-next-line no-console
						console.warn(`No form attachments in directory: ${fixtureDirectory}`);
					}

					continue;
				}

				for (const fixture of fixtures) {
					const resource = JRResource.fromFormAttachmentFixture(category, fixture);

					this.setRegisteredResourceState(resource);
				}
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error occurred during resource state setup:', error);

			this.reset();
		}
	}

	// Used to mock fetch in unit tests that work with attachments
	activateResource(metadata: InlineFixtureMetadata, data: string): void {
		const url = JRResourceURL.from(metadata.url);
		const load = () => Promise.resolve(data);
		const resource = new JRResource({
			url,
			fileName: metadata.fileName,
			mimeType: metadata.mimeType,
			load,
		});

		this.setRegisteredResourceState(resource);
	}

	reset(): void {
		this.resources.clear();
	}
}
