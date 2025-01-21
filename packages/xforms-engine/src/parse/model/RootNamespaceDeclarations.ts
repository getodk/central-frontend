import { XMLNS_NAMESPACE_URI, XMLNS_PREFIX } from '@getodk/common/constants/xmlns.ts';
import type { RootAttributeDefinition } from './RootAttributeDefinition.ts';
import { RootNamespaceDeclaration } from './RootNamespaceDeclaration.ts';

export class RootNamespaceDeclarations extends Map<string | null, RootNamespaceDeclaration> {
	constructor(sourceElement: Element, attributes: readonly RootAttributeDefinition[]) {
		const { prefix: elementPrefix, namespaceURI: elementNamespaceURI } = sourceElement;

		super([[elementPrefix, new RootNamespaceDeclaration(elementPrefix, elementNamespaceURI)]]);

		this.set(
			sourceElement.prefix,
			new RootNamespaceDeclaration(sourceElement.prefix, sourceElement.namespaceURI)
		);

		for (const attribute of attributes) {
			const { namespaceURI, nodeName, prefix, localName, value } = attribute;

			// Attribute **IS** a namespace declaration. See commentary on
			// `RootAttributeDefinition`.
			if (namespaceURI === XMLNS_NAMESPACE_URI) {
				// If the nodeName is `xmlns`, the attribute is a **DEFAULT**
				// namespace declaration (also known as the "null namespace"). In
				// which case, the _declared prefix_ is `null`.
				if (nodeName === XMLNS_PREFIX) {
					this.set(null, new RootNamespaceDeclaration(null, value));
				}
				// Otherwise, the declared prefix is the attribute node's _local name_,
				// e.g. `xmlns:orx` is a declaration for the namespace prefix `orx`.
				else {
					this.set(null, new RootNamespaceDeclaration(localName, value));
				}
			} else if (!this.has(prefix)) {
				this.set(prefix, new RootNamespaceDeclaration(prefix, namespaceURI));
			}
		}
	}
}
