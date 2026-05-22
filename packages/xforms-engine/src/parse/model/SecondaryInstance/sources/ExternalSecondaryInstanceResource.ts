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

const getFormatFromFileExtension = (
	url: string,
	data: string
): ExternalSecondaryInstanceSourceFormat | undefined => {
	if (url.endsWith('.xml') && data.startsWith('<')) {
		return 'xml';
	}
	if (url.endsWith('.csv')) {
		return 'csv';
	}
	if (url.endsWith('.geojson') && data.startsWith('{')) {
		return 'geojson';
	}
	return;
};

const getFormatFromContentType = (
	contentType: string | null
): ExternalSecondaryInstanceSourceFormat | undefined => {
	if (contentType === 'text/csv') {
		return 'csv';
	}
	if (contentType === 'application/geo+json') {
		return 'geojson';
	}
	if (contentType === 'text/xml') {
		return 'xml';
	}
	return;
};

const getFormat = (
	resourceURL: JRResourceURL,
	response: FetchResourceResponse,
	data: string
): ExternalSecondaryInstanceSourceFormat => {
	const contentType = getResponseContentType(response);
	const url = resourceURL.href;
	const format = getFormatFromContentType(contentType) ?? getFormatFromFileExtension(url, data);
	if (!format) {
		throw new ErrorProductionDesignPendingError(
			`Failed to determine external secondary instance format for resource "${url}", content type: "${contentType}"`
		);
	}
	return format;
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
			return new this(response.status, instanceId, resourceURL, 'xml', '', {
				isExplicitlyBlank: true,
			});
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
		const metadata = getFormat(resourceURL, response, data);

		return new this(response.status ?? null, instanceId, resourceURL, metadata, data, {
			isExplicitlyBlank: false,
		}) satisfies ExternalSecondaryInstanceResource as LoadedExternalSecondaryInstanceResource;
	}

	readonly isBlank: boolean;

	private constructor(
		readonly responseStatus: number | null,
		readonly instanceId: string,
		resourceURL: JRResourceURL,
		readonly format: Format,
		data: string,
		options: ExternalSecondaryInstanceResourceOptions
	) {
		super('secondary-instance', resourceURL, data);
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
