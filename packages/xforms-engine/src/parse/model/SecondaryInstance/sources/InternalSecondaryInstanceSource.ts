import { parseStaticDocumentFromDOMSubtree } from '../../../shared/parseStaticDocumentFromDOMSubtree.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import { assertSecondaryInstanceDefinition } from '../assertSecondaryInstanceDefinition.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';

export class InternalSecondaryInstanceSource extends SecondaryInstanceSource<'internal'> {
	constructor(instanceId: string, resourceURL: null, domElement: DOMSecondaryInstanceElement) {
		super('internal', instanceId, resourceURL, domElement);
	}

	parseDefinition(): SecondaryInstanceDefinition {
		const doc = parseStaticDocumentFromDOMSubtree(this.domElement, {
			nodesetPrefix: `instance('${this.instanceId}')`,
		});

		assertSecondaryInstanceDefinition(doc);

		return doc;
	}
}
