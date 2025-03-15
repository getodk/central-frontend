import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { RootAttributeDefinition } from './RootAttributeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

/**
 * @todo We should probably just distinguish these as separate `StaticNode`
 * subclasses, probably as separate collections on `StaticElement`!
 */
const isNonNamespaceAttribute = (attribute: StaticAttribute) => {
	return attribute.qualifiedName.namespaceURI?.href !== XMLNS_NAMESPACE_URI;
};

/**
 * @todo This can be trivially expanded to a narrowly general case when we
 * prioritize work to
 * {@link https://github.com/getodk/web-forms/issues/285 | support attributes}
 * (as modeled form nodes on par with elements). It's been deferred here to
 * avoid expanding scope of an already fairly large yak shave.
 *
 * @todo There's a **much more expansive** general case just waiting for a good
 * opportuntity to prioritize it. E.g. a `NamedNodeMap<T>`, where T is any
 * generalized concept of a named node. This expansive generalization would have
 * a ton of value in a variety of known performance optimization
 * targets/solutions (i.e. optimizing the most redundant, suboptimal, frequently
 * performed aspects of any typical XPath expression in a typical XForm).
 *
 * @see {@link QualifiedName} for more detail.
 */
export class RootAttributeMap extends Map<QualifiedName, RootAttributeDefinition> {
	static from(root: RootDefinition, instanceNode: StaticElement) {
		const nonNamespaceAttributes = instanceNode.attributes.filter(isNonNamespaceAttribute);
		const definitions = nonNamespaceAttributes.map((attribute) => {
			return new RootAttributeDefinition(root, attribute);
		});

		return new this(definitions);
	}

	private constructor(definitions: readonly RootAttributeDefinition[]) {
		super(
			definitions.map((attribute) => {
				return [attribute.qualifiedName, attribute];
			})
		);
	}
}
