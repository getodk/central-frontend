import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { StaticDocument } from '../../../../integration/xpath/static-dom/StaticDocument.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import { assertSecondaryInstanceDefinition } from '../assertSecondaryInstanceDefinition.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';

export class BlankSecondaryInstanceSource extends SecondaryInstanceSource<'blank'> {
	constructor(
		instanceId: string,
		resourceURL: JRResourceURL,
		domElement: DOMSecondaryInstanceElement
	) {
		super('blank', instanceId, resourceURL, domElement);
	}

	parseDefinition(): SecondaryInstanceDefinition {
		const doc = new StaticDocument({
			documentRoot: {
				name: 'instance',
				attributes: [
					{
						name: 'id',
						value: this.instanceId,
					},
				],
			},
		});

		assertSecondaryInstanceDefinition(doc);

		return doc;
	}
}
