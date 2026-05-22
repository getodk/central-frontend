import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { AttributeDefinition } from './AttributeDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

/**
 * @todo We should probably just distinguish these as separate `StaticNode`
 * subclasses, probably as separate collections on `StaticElement`!
 */
const isNonNamespaceAttribute = (attribute: StaticAttribute) => {
	return attribute.qualifiedName.namespaceURI?.href !== XMLNS_NAMESPACE_URI;
};

/**
 * @todo There's a **much more expansive** general case just waiting for a good
 * opportuntity to prioritize it. E.g. a `NamedNodeMap<T>`, where T is any
 * generalized concept of a named node. This expansive generalization would have
 * a ton of value in a variety of known performance optimization
 * targets/solutions (i.e. optimizing the most redundant, suboptimal, frequently
 * performed aspects of any typical XPath expression in a typical XForm).
 *
 * @see {@link QualifiedName} for more detail.
 */
export class AttributeDefinitionMap extends Map<QualifiedName, AttributeDefinition> {
	static from(model: ModelDefinition, instanceNode: StaticElement) {
		const nonNamespaceAttributes = instanceNode.attributes.filter(isNonNamespaceAttribute);
		const definitions = nonNamespaceAttributes.map((attribute) => {
			const bind = model.binds.getOrCreateBindDefinition(attribute.nodeset);
			return new AttributeDefinition(model, bind, attribute);
		});
		return new this(definitions);
	}

	private constructor(definitions: readonly AttributeDefinition[]) {
		super(
			definitions.map((attribute) => {
				return [attribute.qualifiedName, attribute];
			})
		);
	}
}
