import { XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { parseStaticDocumentFromDOMSubtree } from '../../../shared/parseStaticDocumentFromDOMSubtree.ts';
import { assertSecondaryInstanceDefinition } from '../assertSecondaryInstanceDefinition.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';
import { ExternalSecondaryInstanceSource } from './ExternalSecondaryInstanceSource.ts';
import type { InternalSecondaryInstanceSource } from './InternalSecondaryInstanceSource.ts';

export class XMLExternalSecondaryInstanceSource extends ExternalSecondaryInstanceSource<'xml'> {
	/**
	 * Note: this logic is a superset of the logic in
	 * {@link InternalSecondaryInstanceSource.parseDefinition}. That subset is so
	 * trivial/already sufficiently abstracted that it doesn't really make a lot
	 * of sense to abstract further, but it might be worth considering if both
	 * method implementations grow their responsibilities in the same ways.
	 */
	parseDefinition(): SecondaryInstanceDefinition {
		const xmlDocument = this.domElement.ownerDocument.implementation.createDocument(
			XFORMS_NAMESPACE_URI,
			'instance'
		);
		const instanceElement = xmlDocument.documentElement;

		instanceElement.setAttribute('id', this.instanceId);
		instanceElement.innerHTML = this.resource.data;

		const doc = parseStaticDocumentFromDOMSubtree(instanceElement);

		assertSecondaryInstanceDefinition(doc);

		return doc;
	}
}
