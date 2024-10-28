import type { XPathNode } from './XPathNode.ts';
import type { AdapterElement, AdapterParentNode } from './XPathNodeKindAdapter.ts';

export interface XPathDOMOptimizableOperations<T extends XPathNode> {
	readonly getLocalNamedAttributeValue: (
		node: AdapterElement<T>,
		localName: string
	) => string | null;

	readonly hasLocalNamedAttribute: (node: AdapterElement<T>, localName: string) => boolean;

	readonly getChildrenByLocalName: (
		node: AdapterParentNode<T>,
		localName: string
	) => Iterable<AdapterElement<T>>;
}
