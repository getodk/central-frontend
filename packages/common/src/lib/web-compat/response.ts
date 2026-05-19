import type { Awaitable } from '../../../types/helpers';
import { BLOB_BEHAVIOR, getBlobData, getBlobText } from './blob.ts';

type BuildFileResponse = (file: File, init?: ResponseInit) => Awaitable<Response>;

/**
 * @see {@link BLOB_BEHAVIOR}, {@link getBlobText}
 */
let buildFileResponse: BuildFileResponse;

if (BLOB_BEHAVIOR === 'BLOB_BEHAVIOR_EXPECTED') {
	buildFileResponse = (file, init) => new Response(file, init);
} else {
	const buildFileResponseHeaders = (file: File, init?: ResponseInit): Headers => {
		const baseHeaders = init?.headers ?? [];

		let headersInit: ReadonlyArray<[key: string, value: string]>;
		let contentType: string;

		if (baseHeaders instanceof Headers) {
			headersInit = Array.from(baseHeaders.entries());
			contentType = baseHeaders.get('content-type') ?? file.type;
		} else {
			if (Array.isArray(baseHeaders)) {
				headersInit = baseHeaders;
			} else {
				headersInit = Object.entries(baseHeaders);
			}

			contentType = file.type;

			for (const [key, value] of headersInit) {
				if (key.toLowerCase() === 'content-type') {
					contentType = value;
				}
			}
		}

		return new Headers([['content-type', contentType], ...headersInit]);
	};

	buildFileResponse = async (file, init) => {
		const headers = buildFileResponseHeaders(file, init);
		const body = await getBlobData(file);

		return new Response(body, {
			...init,
			headers,
		});
	};
}

export { buildFileResponse };
