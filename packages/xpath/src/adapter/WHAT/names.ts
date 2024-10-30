import type { WHATNamedNode, WHATNode } from './WHATNode.ts';

export const getWHATNamespaceURI = (node: WHATNamedNode): string | null => {
	return node.namespaceURI;
};

export const getWHATLocalName = (node: WHATNamedNode): string => {
	return node.localName;
};

export const resolveWHATNamespaceURI = (node: WHATNode, prefix: string | null): string | null => {
	return node.lookupNamespaceURI(prefix);
};
