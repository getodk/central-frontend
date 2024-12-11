import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import type { ExternalSecondaryInstanceResource } from './ExternalSecondaryInstanceResource.ts';
import type { ExternalSecondaryInstanceSourceFormat } from './SecondaryInstanceSource.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';

export abstract class ExternalSecondaryInstanceSource<
	Format extends ExternalSecondaryInstanceSourceFormat = ExternalSecondaryInstanceSourceFormat,
> extends SecondaryInstanceSource<Format> {
	override readonly resourceURL: JRResourceURL;

	constructor(
		domElement: DOMSecondaryInstanceElement,
		protected readonly resource: ExternalSecondaryInstanceResource<Format>
	) {
		const { format, instanceId, resourceURL } = resource;

		super(format, instanceId, resourceURL, domElement);

		this.resourceURL = resourceURL;
	}
}
