import { parseStaticDocumentFromDOMSubtree } from '../../../shared/parseStaticDocumentFromDOMSubtree.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import { SecondaryInstanceDefinition } from '../SecondaryInstanceDefinition.ts';
import { SecondaryInstanceRootDefinition } from '../SecondaryInstanceRootDefinition.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';

export class InternalSecondaryInstanceSource extends SecondaryInstanceSource<'internal'> {
	constructor(instanceId: string, resourceURL: null, domElement: DOMSecondaryInstanceElement) {
		super('internal', instanceId, resourceURL, domElement);
	}

	parseDefinition(): SecondaryInstanceDefinition {
		return parseStaticDocumentFromDOMSubtree(
			SecondaryInstanceDefinition,
			SecondaryInstanceRootDefinition,
			this.domElement
		);
	}
}
