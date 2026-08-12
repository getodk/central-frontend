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
      const source = new XMLExternalSecondaryInstanceSource(domElement, resource);
      const parsed = source.parseDefinition();
      return { source, parsed };
    } catch {
      // error parsing xml - don't block the user from filling in the form
    }
  }
  const source = new BlankSecondaryInstanceSource(instanceId, resourceURL, domElement);
  const parsed = source.parseDefinition();
  return { source, parsed };
};

const loadExternal = async (
  domElement: DOMSecondaryInstanceElement,
  instanceId: string,
  resourceURL: JRResourceURL,
  options: ExternalSecondaryInstanceResourceLoadOptions
) => {
  const resource = await ExternalSecondaryInstanceResource.load(instanceId, resourceURL, options);

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
      const { source, parsed } = createLastSavedInstance(
        domElement,
        instanceId,
        resourceURL,
        lastSavedXml
      );
      this.lastSaved = source;
      this.set(instanceId, parsed.root);
    }
  }

  static async load(
    xformDOM: XFormDOM,
    options: ExternalSecondaryInstanceResourceLoadOptions
  ): Promise<SecondaryInstancesDefinition> {
    const { secondaryInstanceElements } = xformDOM;
    let lastSavedSource;

    const sources = await Promise.all(
      secondaryInstanceElements.map(async (domElement) => {
        const instanceId = domElement.getAttribute('id');
        const src = domElement.getAttribute('src');

        if (src == null) {
          return new InternalSecondaryInstanceSource(instanceId, src, domElement).parseDefinition();
        }

        if (!JRResourceURL.isJRResourceReference(src)) {
          throw new ErrorProductionDesignPendingError(
            `Unexpected external secondary instance src attribute: ${src}`
          );
        }

        const resourceURL = JRResourceURL.from(src);

        if (resourceURL.isLastSavedInstance()) {
          const { source, parsed } = createLastSavedInstance(
            domElement,
            instanceId,
            resourceURL,
            options.lastSavedXml
          );
          lastSavedSource = source;
          return parsed;
        }

        const source = await loadExternal(domElement, instanceId, resourceURL, options);
        return source.parseDefinition();
      })
    );

    return new this(sources, lastSavedSource);
  }

  private constructor(
    definitions: readonly SecondaryInstanceDefinition[],
    lastSaved: SecondaryInstanceSource | undefined
  ) {
    super(
      definitions.map((definition) => [definition.root.getAttributeValue('id'), definition.root])
    );
    this.lastSaved = lastSaved;
    this.hasLastSaved = !!this.lastSaved;
  }
}
