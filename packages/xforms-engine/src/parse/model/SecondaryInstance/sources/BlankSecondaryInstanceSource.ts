import { XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { StaticNode } from '../../../../integration/xpath/static-dom/StaticNode.ts';
import { parseStaticDocumentFromDOMSubtree } from '../../../shared/parseStaticDocumentFromDOMSubtree.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import { SecondaryInstanceDefinition } from '../SecondaryInstanceDefinition.ts';
import { SecondaryInstanceRootDefinition } from '../SecondaryInstanceRootDefinition.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';

export class BlankSecondaryInstanceSource extends SecondaryInstanceSource<'blank'> {
	constructor(
		instanceId: string,
		resourceURL: JRResourceURL,
		domElement: DOMSecondaryInstanceElement
	) {
		super('blank', instanceId, resourceURL, domElement);
	}

	/**
	 * @todo there is really no sense in using the DOM for this, other than it was
	 * quicker/more ergonomic than constructing the requisite {@link StaticNode}
	 * structures directly. Pretty good sign those constructor signatures could
	 * use some TLC!
	 */
	parseDefinition(): SecondaryInstanceDefinition {
		const xmlDocument = this.domElement.ownerDocument.implementation.createDocument(
			XFORMS_NAMESPACE_URI,
			'instance'
		);
		const instanceElement = xmlDocument.documentElement;

		instanceElement.setAttribute('id', this.instanceId);

		return parseStaticDocumentFromDOMSubtree(
			SecondaryInstanceDefinition,
			SecondaryInstanceRootDefinition,
			instanceElement
		);
	}
}
