import type { WHATNamedNode, WHATNode, WHATProcessingInstruction } from './WHATNode.ts';

export const getWHATNamespaceURI = (node: WHATNamedNode): string | null => {
	return node.namespaceURI;
};

export const getWHATQualifiedName = (node: WHATNamedNode): string => {
	return node.nodeName;
};

export const getWHATLocalName = (node: WHATNamedNode): string => {
	return node.localName;
};

export const getWHATProcessingInstructionName = (node: WHATProcessingInstruction): string => {
	return node.nodeName;
};

export const resolveWHATNamespaceURI = (node: WHATNode, prefix: string | null): string | null => {
	return node.lookupNamespaceURI(prefix);
};
