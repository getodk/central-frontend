import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FetchResource, FetchResourceResponse } from '../../../../client/resources.ts';
import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError.ts';
import { FormAttachmentResource } from '../../../attachments/FormAttachmentResource.ts';
import type { ExternalSecondaryInstanceSourceFormat } from './SecondaryInstanceSource.ts';

const assertResponseSuccess = (resourceURL: JRResourceURL, response: FetchResourceResponse) => {
	const { ok = true, status = 200 } = response;

	if (!ok || status !== 200) {
		throw new ErrorProductionDesignPendingError(`Failed to load ${resourceURL.href}`);
	}
};

const stripContentTypeCharset = (contentType: string): string => {
	return contentType.replace(/;charset=.*$/, '');
};

const getResponseContentType = (response: FetchResourceResponse): string | null => {
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

interface ExternalSecondaryInstanceResourceMetadata<
	Format extends ExternalSecondaryInstanceSourceFormat = ExternalSecondaryInstanceSourceFormat,
> {
	readonly contentType: string;
	readonly format: Format;
}

const inferSecondaryInstanceResourceMetadata = (
	resourceURL: JRResourceURL,
	contentType: string | null,
	data: string
): ExternalSecondaryInstanceResourceMetadata => {
	const url = resourceURL.href;

	let format: ExternalSecondaryInstanceSourceFormat | null = null;

	if (url.endsWith('.xml') && data.startsWith('<')) {
		format = 'xml';
	} else if (url.endsWith('.csv')) {
		format = 'csv';
	} else if (url.endsWith('.geojson') && data.startsWith('{')) {
		format = 'geojson';
	}

	if (format == null) {
		throw new ErrorProductionDesignPendingError(
			`Failed to infer external secondary instance format/content type for resource ${url} (response content type: ${contentType}, data: ${data})`
		);
	}

	return {
		contentType: contentType ?? 'text/plain',
		format,
	};
};

const detectSecondaryInstanceResourceMetadata = (
	resourceURL: JRResourceURL,
	response: FetchResourceResponse,
	data: string
): ExternalSecondaryInstanceResourceMetadata => {
	const contentType = getResponseContentType(response);

	if (contentType == null || contentType === 'text/plain') {
		return inferSecondaryInstanceResourceMetadata(resourceURL, contentType, data);
	}

	let format: ExternalSecondaryInstanceSourceFormat | null = null;

	switch (contentType) {
		case 'text/csv':
			format = 'csv';
			break;

		case 'application/geo+json':
			format = 'geojson';
			break;

		case 'text/xml':
			format = 'xml';
			break;
	}

	if (format == null) {
		throw new ErrorProductionDesignPendingError(
			`Failed to detect external secondary instance format for resource ${resourceURL.href} (response content type: ${contentType}, data: ${data})`
		);
	}

	return {
		contentType,
		format,
	};
};

export interface ExternalSecondaryInstanceResourceOptions {
	readonly fetchResource: FetchResource<JRResourceURL>;
}

type LoadedExternalSecondaryInstanceResource = {
	[Format in ExternalSecondaryInstanceSourceFormat]: ExternalSecondaryInstanceResource<Format>;
}[ExternalSecondaryInstanceSourceFormat];

export class ExternalSecondaryInstanceResource<
	Format extends ExternalSecondaryInstanceSourceFormat = ExternalSecondaryInstanceSourceFormat,
> extends FormAttachmentResource<'secondary-instance'> {
	static async load(
		instanceId: string,
		resourceURL: JRResourceURL,
		options: ExternalSecondaryInstanceResourceOptions
	): Promise<LoadedExternalSecondaryInstanceResource | null> {
		const response = await options.fetchResource(resourceURL);

		if (response.status === 404) {
			return null;
		}

		assertResponseSuccess(resourceURL, response);

		const data = await response.text();
		const metadata = detectSecondaryInstanceResourceMetadata(resourceURL, response, data);

		return new this(
			response.status ?? null,
			instanceId,
			resourceURL,
			metadata,
			data
		) satisfies ExternalSecondaryInstanceResource as LoadedExternalSecondaryInstanceResource;
	}

	readonly format: Format;

	protected constructor(
		readonly responseStatus: number | null,
		readonly instanceId: string,
		resourceURL: JRResourceURL,
		metadata: ExternalSecondaryInstanceResourceMetadata<Format>,
		data: string
	) {
		const { contentType, format } = metadata;

		super('secondary-instance', resourceURL, contentType, data);

		this.format = format;
	}
}
