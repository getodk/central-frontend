import type { XPathNode } from './XPathNode.ts';
import type { AdapterQualifiedNamedNode } from './XPathNodeKindAdapter.ts';

export interface XPathNameAdapter<T extends XPathNode> {
	readonly getNamespaceURI: (node: AdapterQualifiedNamedNode<T>) => string | null;
	readonly getLocalName: (node: AdapterQualifiedNamedNode<T>) => string;
	readonly resolveNamespaceURI: (node: T, prefix: string | null) => string | null;
}
