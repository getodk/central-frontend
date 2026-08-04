import { XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { parseStaticDocumentFromDOMSubtree } from '../../../shared/parseStaticDocumentFromDOMSubtree.ts';
import { assertSecondaryInstanceDefinition } from '../assertSecondaryInstanceDefinition.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';

export class LastSavedInstanceSource extends SecondaryInstanceSource<'xml'> {
  constructor(
    domElement: DOMSecondaryInstanceElement,
    instanceId: string,
    resourceURL: JRResourceURL,
    readonly xml: string
  ) {
    super('xml', instanceId, resourceURL, domElement);
  }

  // TODO this is duplicated with XMLExternalSecondaryInstanceSource - extract to util
  parseDefinition(): SecondaryInstanceDefinition {
    const xmlDocument = this.domElement.ownerDocument.implementation.createDocument(
      XFORMS_NAMESPACE_URI,
      'instance'
    );
    const instanceElement = xmlDocument.documentElement;

    instanceElement.setAttribute('id', this.instanceId);
    instanceElement.innerHTML = this.xml;

    const doc = parseStaticDocumentFromDOMSubtree(instanceElement);

    assertSecondaryInstanceDefinition(doc);

    return doc;
  }
}
