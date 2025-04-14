import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { MissingResourceBehavior } from '../../../../client/constants.ts';
import type { FetchResource, FetchResourceResponse } from '../../../../client/resources.ts';
import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError.ts';
import { getResponseContentType } from '../../../../lib/resource-helpers.ts';
import { FormAttachmentResource } from '../../../attachments/FormAttachmentResource.ts';
import type { ExternalSecondaryInstanceSourceFormat } from './SecondaryInstanceSource.ts';

const assertResponseSuccess = (resourceURL: JRResourceURL, response: FetchResourceResponse) => {
	const { ok = true, status = 200 } = response;

	if (!ok || status !== 200) {
		throw new ErrorProductionDesignPendingError(`Failed to load ${resourceURL.href}`);
	}
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

interface MissingResourceResponse extends FetchResourceResponse {
	readonly status: 404;
}

export interface ExternalSecondaryInstanceResourceLoadOptions {
	readonly fetchResource: FetchResource<JRResourceURL>;
	readonly missingResourceBehavior: MissingResourceBehavior;
}

type LoadedExternalSecondaryInstanceResource = {
	[Format in ExternalSecondaryInstanceSourceFormat]: ExternalSecondaryInstanceResource<Format>;
}[ExternalSecondaryInstanceSourceFormat];

interface ExternalSecondaryInstanceResourceOptions {
	readonly isExplicitlyBlank?: boolean;
}

export class ExternalSecondaryInstanceResource<
	Format extends ExternalSecondaryInstanceSourceFormat = ExternalSecondaryInstanceSourceFormat,
> extends FormAttachmentResource<'secondary-instance'> {
	private static isMissingResource(
		response: FetchResourceResponse
	): response is MissingResourceResponse {
		return response.status === 404;
	}

	private static createBlankResource(
		instanceId: string,
		resourceURL: JRResourceURL,
		response: MissingResourceResponse,
		options: ExternalSecondaryInstanceResourceLoadOptions
	) {
		if (options.missingResourceBehavior === 'BLANK') {
			return new this(
				response.status,
				instanceId,
				resourceURL,
				{
					format: 'xml',
					contentType: 'text/xml',
				},
				'',
				{ isExplicitlyBlank: true }
			);
		}

		throw new ErrorProductionDesignPendingError(
			`Failed to load resource: ${resourceURL.href}: resource is missing (status: ${response.status})`
		);
	}

	static async load(
		instanceId: string,
		resourceURL: JRResourceURL,
		options: ExternalSecondaryInstanceResourceLoadOptions
	): Promise<LoadedExternalSecondaryInstanceResource> {
		const response = await options.fetchResource(resourceURL);

		if (this.isMissingResource(response)) {
			return this.createBlankResource(instanceId, resourceURL, response, options);
		}

		assertResponseSuccess(resourceURL, response);

		const data = await response.text();
		const metadata = detectSecondaryInstanceResourceMetadata(resourceURL, response, data);

		return new this(response.status ?? null, instanceId, resourceURL, metadata, data, {
			isExplicitlyBlank: false,
		}) satisfies ExternalSecondaryInstanceResource as LoadedExternalSecondaryInstanceResource;
	}

	readonly format: Format;
	readonly isBlank: boolean;

	private constructor(
		readonly responseStatus: number | null,
		readonly instanceId: string,
		resourceURL: JRResourceURL,
		metadata: ExternalSecondaryInstanceResourceMetadata<Format>,
		data: string,
		options: ExternalSecondaryInstanceResourceOptions
	) {
		const { contentType, format } = metadata;

		super('secondary-instance', resourceURL, contentType, data);

		this.format = format;

		if (data === '') {
			if (options.isExplicitlyBlank) {
				this.isBlank = true;
			} else {
				throw new ErrorProductionDesignPendingError(
					`Failed to load blank external secndary instance ${resourceURL.href}`
				);
			}
		} else {
			this.isBlank = false;
		}
	}
}
