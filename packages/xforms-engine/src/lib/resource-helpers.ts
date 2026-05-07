import type { FetchResourceResponse } from '../client/resources.ts';

const CONTENT_TYPE_CHARSET_PATTERN = /\s*;\s*charset\s*=.*$/;

const stripContentTypeCharset = (contentType: string): string => {
	return contentType.replace(CONTENT_TYPE_CHARSET_PATTERN, '');
};

export const getResponseContentType = (response: FetchResourceResponse): string | null => {
	const { headers } = response;

	if (headers == null) {
		return null;
	}

	const contentType = headers.get('content-type');

	if (contentType != null) {
		return stripContentTypeCharset(contentType);
	}

	if (headers instanceof Headers) {
		return contentType;
	}

	for (const [header, value] of headers) {
		if (header.toLowerCase() === 'content-type') {
			return stripContentTypeCharset(value);
		}
	}

	return null;
};
