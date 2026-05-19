import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';

// prettier-ignore
export type ExternalSecondaryInstanceSourceFormat =
	| 'csv'
	| 'geojson'
	| 'xml';

// prettier-ignore
export type SecondaryInstanceSourceFormat =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| ExternalSecondaryInstanceSourceFormat
	| 'internal'
	| 'blank';

export abstract class SecondaryInstanceSource<
	Format extends SecondaryInstanceSourceFormat = SecondaryInstanceSourceFormat,
> {
	constructor(
		readonly format: Format,
		readonly instanceId: string,
		readonly resourceURL: JRResourceURL | null,
		readonly domElement: DOMSecondaryInstanceElement
	) {}

	abstract parseDefinition(): SecondaryInstanceDefinition;
}
