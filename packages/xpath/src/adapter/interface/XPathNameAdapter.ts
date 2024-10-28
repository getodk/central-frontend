import type { XPathNode } from './XPathNode.ts';
import type { AdapterQualifiedNamedNode } from './XPathNodeKindAdapter.ts';

export interface XPathNameAdapter<T extends XPathNode> {
	readonly getNamespaceURI: (node: AdapterQualifiedNamedNode<T>) => string | null;
}
