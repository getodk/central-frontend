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
import type { XFormDOM } from '../../XFormDOM.ts';
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

export class SecondaryInstancesDefinition
	extends Map<string, SecondaryInstanceRootDefinition>
	implements XFormsSecondaryInstanceMap<EngineXPathNode>
{
	/**
	 * @package Only to be used for testing
	 */
	static loadSync(xformDOM: XFormDOM): SecondaryInstancesDefinition {
		const { secondaryInstanceElements } = xformDOM;
		const sources = secondaryInstanceElements.map((domElement) => {
			const instanceId = domElement.getAttribute('id');
			const src = domElement.getAttribute('src');

			if (src != null) {
				throw new ErrorProductionDesignPendingError(
					`Unexpected external secondary instance src attribute: ${src}`
				);
			}

			return new InternalSecondaryInstanceSource(instanceId, src, domElement);
		});

		return new this(sources);
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
	}
}
