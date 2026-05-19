import { describe, expect, it } from 'vitest';
import type { FetchResourceResponse, FormResource } from '../../src/instance/resource.ts';
import { retrieveSourceXMLResource } from '../../src/instance/resource.ts';

const textBlob = (text: string): Blob => {
	const encoder = new TextEncoder();
	const binary = encoder.encode(text);
	const buffer = binary.buffer;

	return new Blob([buffer]);
};

const textFile = (text: string): File => {
	const encoder = new TextEncoder();
	const binary = encoder.encode(text);
	const buffer = binary.buffer;

	return new File([buffer], 'filename.txt');
};

describe('Resource retrieval', () => {
	const formXML = '<h:html />';

	describe('from URL', () => {
		const targetURL = new URL('https://example.com/xform.xml');

		const errorResponse = (errorMessage?: string) => {
			return {
				ok: false,
				body: null,
				bodyUsed: false,
				blob() {
					return Promise.reject(new Error(errorMessage ?? 'Unknown request error'));
				},
				text() {
					return Promise.reject(new Error(errorMessage ?? 'Unknown request error'));
				},
			} satisfies FetchResourceResponse;
		};

		const fetchResource = (resource: FormResource, errorMessage?: string) => {
			if (resource instanceof URL && resource.href === targetURL.href) {
				return Promise.resolve<FetchResourceResponse>({
					ok: true,
					blob() {
						return Promise.resolve(textBlob(formXML));
					},
					text() {
						return Promise.resolve(formXML);
					},
				});
			}

			return Promise.resolve(errorResponse(errorMessage));
		};

		it('retrieves XML from the provided source URL and client-provided fetch handler', async () => {
			const sourceXML = await retrieveSourceXMLResource(targetURL, { fetchResource });

			expect(sourceXML).toBe(formXML);
		});

		it('retrieves XML from the provided source URL string and client-provided fetch handler', async () => {
			const sourceXML = await retrieveSourceXMLResource(targetURL.href, { fetchResource });

			expect(sourceXML).toBe(formXML);
		});

		it('propagates client request failure', async () => {
			const errorMessage = 'NOPE';
			const retrieve = () =>
				retrieveSourceXMLResource('http://example.com/nonexistent.xml', {
					fetchResource: (resource) => {
						return fetchResource(resource, errorMessage);
					},
				});

			await expect(retrieve).rejects.toThrow(errorMessage);
		});
	});

	describe('from direct XML source text', () => {
		it('retrieves the XML as provided', async () => {
			const sourceXML = await retrieveSourceXMLResource(formXML, {
				fetchResource: globalThis.fetch,
			});

			expect(sourceXML).toBe(formXML);
		});

		it.each([
			{ paddingType: 'leading', paddedFormXML: ` \n\t${formXML}` },
			{ paddingType: 'trailing', paddedFormXML: ` ${formXML}\n\t ` },
		])('ignores $paddingType whitespace in provided XML', async ({ paddedFormXML }) => {
			const sourceXML = await retrieveSourceXMLResource(paddedFormXML, {
				fetchResource: globalThis.fetch,
			});

			expect(sourceXML).toBe(formXML);
		});

		// TODO: this is ambiguous in the client interface! It may very well be
		// that a client will call the engine with a "form resource" which is actually
		// a valid XForm, and still expect to perform additional retrieval logic with
		// that valid XForm as input. It's an unlikely scenario, but one which we'd
		// do well to address.
		it('does not perform a superfluous network request', async () => {
			const sourceXML = await retrieveSourceXMLResource(formXML, {
				fetchResource: () => {
					return Promise.reject(new Error('Performing any request would fail!'));
				},
			});

			expect(sourceXML).toBe(formXML);
		});
	});

	describe('from binary source', () => {
		it('retrieves the text from a raw binary Blob', async () => {
			const formBlob = textBlob(formXML);

			const sourceXML = await retrieveSourceXMLResource(formBlob, {
				fetchResource: globalThis.fetch,
			});

			expect(sourceXML).toBe(formXML);
		});

		it('retrieves the text from a File', async () => {
			const formFile = textFile(formXML);
			const sourceXML = await retrieveSourceXMLResource(formFile, {
				fetchResource: globalThis.fetch,
			});

			expect(sourceXML).toBe(formXML);
		});
	});
});
