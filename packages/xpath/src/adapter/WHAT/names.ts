import type { WHATNamedNode } from './WHATNode.ts';

export const getWHATNamespaceURI = (node: WHATNamedNode): string | null => {
	return node.namespaceURI;
};
