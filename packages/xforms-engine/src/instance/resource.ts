import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import type { FetchResource, FetchResourceResponse } from '../client/EngineConfig.ts';
import type { FormResource } from '../client/index.ts';

export type { FetchResource, FetchResourceResponse, FormResource };

export interface ResourceOptions {
	readonly fetchResource: FetchResource;
}

const fetchTextFromURL = async (resource: URL, options: ResourceOptions): Promise<string> => {
	const response = await options.fetchResource(resource);

	return response.text();
};

const resourceXMLPrefix = '<';

type ResourceXMLPrefix = typeof resourceXMLPrefix;

type ResourceXML = `${ResourceXMLPrefix}${string}`;

class InvalidSourceXMLError extends Error {
	constructor(readonly resourceText: string) {
		super('Source text is not XML');
	}
}

const isXML = (resourceText: string): resourceText is ResourceXML => {
	return resourceText.startsWith(resourceXMLPrefix);
};

type AssertResourceTextIsXML = (resourceText: string) => asserts resourceText is ResourceXML;

const assertResourceTextIsXML: AssertResourceTextIsXML = (resourceText) => {
	if (!isXML(resourceText)) {
		throw new InvalidSourceXMLError(resourceText);
	}
};

class InvalidFormResourceError extends Error {
	constructor(readonly resource: FormResource) {
		super('Invalid form resource');
	}
}

export const retrieveSourceXMLResource = async (
	resource: FormResource,
	options: ResourceOptions
): Promise<ResourceXML> => {
	let text: string;

	if (resource instanceof URL) {
		text = await fetchTextFromURL(resource, options);
	} else if (resource instanceof Blob) {
		text = await getBlobText(resource);
	} else if (typeof resource === 'string') {
		const trimmed = resource.trim();

		if (isXML(trimmed)) {
			text = trimmed;
		} else if (URL.canParse(trimmed)) {
			text = await fetchTextFromURL(new URL(trimmed), options);
		} else {
			throw new InvalidFormResourceError(trimmed);
		}
	} else {
		throw new UnreachableError(resource);
	}

	assertResourceTextIsXML(text);

	return text;
};
