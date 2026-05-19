import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';
import { describe, expect, it } from 'vitest';
import type { FetchResourceResponse } from '../../../../../src';
import { MISSING_RESOURCE_BEHAVIOR } from '../../../../../src/client/constants';
import { ExternalSecondaryInstanceResource } from '../../../../../src/parse/model/SecondaryInstance/sources/ExternalSecondaryInstanceResource';

describe('ExternalSecondaryInstanceResource', () => {
	const createResponse = (
		status: number,
		response: string,
		contentType?: string
	): FetchResourceResponse => {
		const headers = new Map();
		if (contentType) {
			headers.set('content-type', `${contentType}; charset=utf-8`);
		}
		return {
			status,
			blob: () => Promise.resolve(new Blob([response])),
			text: () => Promise.resolve(response),
			headers,
		};
	};

	const load = async (
		resourceUrl: JRResourceURL,
		response: FetchResourceResponse
	): Promise<ExternalSecondaryInstanceResource> => {
		return await ExternalSecondaryInstanceResource.load('secondary', resourceUrl, {
			fetchResource: () => Promise.resolve(response),
			missingResourceBehavior: MISSING_RESOURCE_BEHAVIOR.BLANK,
		});
	};

	it('returns blank for missing resource', async () => {
		const url = JRResourceURL.create('file', 'name');
		const response = createResponse(404, '');
		const actual = await load(url, response);
		expect(actual.responseStatus).to.equal(404);
		expect(actual.format).to.equal('xml');
		expect(actual.isBlank).to.equal(true);
	});

	it('throws an error for unknown content', async () => {
		const url = JRResourceURL.create('file', 'name.xyz'); // unknown extension
		const response = createResponse(200, 'a,b,c', 'marcel/marceau'); // unknown mime
		await expect(() => load(url, response)).rejects.toThrowError(
			'Failed to determine external secondary instance format for resource "jr://file/name.xyz", content type: "marcel/marceau"'
		);
	});

	describe('detects format from content-type header', () => {
		it('csv', async () => {
			const url = JRResourceURL.create('file', 'name');
			const response = createResponse(200, 'a,b,c', 'text/csv');
			const actual = await load(url, response);
			expect(actual.responseStatus).to.equal(200);
			expect(actual.format).to.equal('csv');
			expect(actual.data).to.equal('a,b,c');
			expect(actual.isBlank).to.equal(false);
		});

		it('geojson', async () => {
			const url = JRResourceURL.create('file', 'name');
			const response = createResponse(200, '{ "a": "b" }', 'application/geo+json');
			const actual = await load(url, response);
			expect(actual.responseStatus).to.equal(200);
			expect(actual.format).to.equal('geojson');
			expect(actual.data).to.equal('{ "a": "b" }');
			expect(actual.isBlank).to.equal(false);
		});

		it('xml', async () => {
			const url = JRResourceURL.create('file', 'name');
			const response = createResponse(200, '<open/>', 'text/xml');
			const actual = await load(url, response);
			expect(actual.responseStatus).to.equal(200);
			expect(actual.format).to.equal('xml');
			expect(actual.data).to.equal('<open/>');
			expect(actual.isBlank).to.equal(false);
		});
	});

	describe('detects format from file extension', () => {
		it('csv', async () => {
			const url = JRResourceURL.create('file', 'name.csv');
			const response = createResponse(200, 'a,b,c', 'application/vnd.ms-excel');
			const actual = await load(url, response);
			expect(actual.responseStatus).to.equal(200);
			expect(actual.format).to.equal('csv');
			expect(actual.data).to.equal('a,b,c');
			expect(actual.isBlank).to.equal(false);
		});

		it('geojson', async () => {
			const url = JRResourceURL.create('file', 'name.geojson');
			const response = createResponse(200, '{ "a": "b" }', 'text/plain');
			const actual = await load(url, response);
			expect(actual.responseStatus).to.equal(200);
			expect(actual.format).to.equal('geojson');
			expect(actual.data).to.equal('{ "a": "b" }');
			expect(actual.isBlank).to.equal(false);
		});

		it('xml', async () => {
			const url = JRResourceURL.create('file', 'name.xml');
			const response = createResponse(200, '<open/>', '');
			const actual = await load(url, response);
			expect(actual.responseStatus).to.equal(200);
			expect(actual.format).to.equal('xml');
			expect(actual.data).to.equal('<open/>');
			expect(actual.isBlank).to.equal(false);
		});
	});
});
