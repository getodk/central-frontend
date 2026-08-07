import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type {
  XFORMS_KNOWN_ATTRIBUTE,
  XFORMS_LOCAL_NAME,
  XFormsSecondaryInstanceMap,
} from '@getodk/xpath';
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import type { EngineXPathNode } from '../../../integration/xpath/adapter/kind.ts';
import type { StaticDocument } from '../../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../../integration/xpath/static-dom/StaticElement.ts';
import type { DOMSecondaryInstanceElement, XFormDOM } from '../../XFormDOM.ts';
import { BlankSecondaryInstanceSource } from './sources/BlankSecondaryInstanceSource.ts';
import { CSVExternalSecondaryInstanceSource } from './sources/CSVExternalSecondaryInstance.ts';
import type { ExternalSecondaryInstanceResourceLoadOptions } from './sources/ExternalSecondaryInstanceResource.ts';
import { ExternalSecondaryInstanceResource } from './sources/ExternalSecondaryInstanceResource.ts';
import { GeoJSONExternalSecondaryInstanceSource } from './sources/GeoJSONExternalSecondaryInstance.ts';
import { InternalSecondaryInstanceSource } from './sources/InternalSecondaryInstanceSource.ts';
import type { SecondaryInstanceSource } from './sources/SecondaryInstanceSource.ts';
import { XMLExternalSecondaryInstanceSource } from './sources/XMLExternalSecondaryInstanceSource.ts';

export interface SecondaryInstanceDefinition extends StaticDocument {
  readonly rootDocument: SecondaryInstanceDefinition;
  readonly root: SecondaryInstanceRootDefinition;
}

export interface SecondaryInstanceRootDefinition extends StaticElement {
  readonly [XFORMS_LOCAL_NAME]: 'instance';
  readonly [XFORMS_KNOWN_ATTRIBUTE]: 'id';

  readonly rootDocument: SecondaryInstanceDefinition;
  readonly root: SecondaryInstanceRootDefinition;

  getAttributeValue(localName: 'id'): string;
  getAttributeValue(localName: string): string | null;
}

const createLastSavedInstance = (
  domElement: DOMSecondaryInstanceElement,
  instanceId: string,
  resourceURL: JRResourceURL,
  xml: string | undefined
) => {
  if (xml) {
    try {
      const resource = ExternalSecondaryInstanceResource.loadXml(instanceId, resourceURL, xml);
      return new XMLExternalSecondaryInstanceSource(domElement, resource);
    } catch {
      // error parsing xml - don't block the user from filling in the form
    }
  }
  return new BlankSecondaryInstanceSource(instanceId, resourceURL, domElement);
};

export class SecondaryInstancesDefinition
  extends Map<string, SecondaryInstanceRootDefinition>
  implements XFormsSecondaryInstanceMap<EngineXPathNode>
{
  readonly hasLastSaved: boolean;
  private lastSaved: SecondaryInstanceSource | undefined;

  resetLastSaved(lastSavedXml: string) {
    if (this.lastSaved?.resourceURL) {
      const { domElement, instanceId, resourceURL } = this.lastSaved;
      const source = createLastSavedInstance(domElement, instanceId, resourceURL, lastSavedXml);
      const { root } = source.parseDefinition();
      this.lastSaved = source;
      this.set(instanceId, root);
    }
  }

  static async load(
    xformDOM: XFormDOM,
    options: ExternalSecondaryInstanceResourceLoadOptions
  ): Promise<SecondaryInstancesDefinition> {
    const { secondaryInstanceElements } = xformDOM;

    const sources = await Promise.all(
      secondaryInstanceElements.map(async (domElement) => {
        const instanceId = domElement.getAttribute('id');
        const src = domElement.getAttribute('src');

        if (src == null) {
          return new InternalSecondaryInstanceSource(instanceId, src, domElement);
        }

        if (!JRResourceURL.isJRResourceReference(src)) {
          throw new ErrorProductionDesignPendingError(
            `Unexpected external secondary instance src attribute: ${src}`
          );
        }

        const resourceURL = JRResourceURL.from(src);

        if (resourceURL.isLastSavedInstance()) {
          return createLastSavedInstance(domElement, instanceId, resourceURL, options.lastSavedXml);
        }

        const resource = await ExternalSecondaryInstanceResource.load(
          instanceId,
          resourceURL,
          options
        );

        if (resource.isBlank) {
          return new BlankSecondaryInstanceSource(instanceId, resourceURL, domElement);
        }

        switch (resource.format) {
          case 'csv':
            return new CSVExternalSecondaryInstanceSource(domElement, resource);

          case 'geojson':
            return new GeoJSONExternalSecondaryInstanceSource(domElement, resource);

          case 'xml':
            return new XMLExternalSecondaryInstanceSource(domElement, resource);

          default:
            throw new UnreachableError(resource);
        }
      })
    );

    return new this(sources);
  }

  private constructor(sources: readonly SecondaryInstanceSource[]) {
    super(
      sources.map((source) => {
        const { root } = source.parseDefinition();

        return [root.getAttributeValue('id'), root];
      })
    );
    this.lastSaved = sources.find((source) => source.resourceURL?.isLastSavedInstance());
    this.hasLastSaved = !!this.lastSaved;
  }
}
