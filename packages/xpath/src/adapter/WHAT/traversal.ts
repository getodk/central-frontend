import {
	isWHATAttribute,
	isWHATDocument,
	isWHATElement,
	isWHATNamespaceDeclaration,
	isWHATParentNode,
} from './kind.ts';
import type {
	WHATAttribute,
	WHATDocument,
	WHATElement,
	WHATNamespaceDeclaration,
	WHATNode,
} from './WHATNode.ts';

export const getContainingWHATDocument = (node: WHATNode): WHATDocument => {
	if (isWHATDocument(node)) {
		return node;
	}

	return node.ownerDocument satisfies Document as WHATDocument;
};

const getAttrs = (node: WHATNode): readonly Attr[] => {
	if (isWHATElement(node)) {
		return Array.from(node.attributes);
	}

	return [];
};

export const getWHATNamespaceDeclarations = (
	node: WHATNode
): readonly WHATNamespaceDeclaration[] => {
	return getAttrs(node).filter(isWHATNamespaceDeclaration);
};

export const getWHATAttributes = (node: WHATNode): readonly WHATAttribute[] => {
	return getAttrs(node).filter(isWHATAttribute);
};

export const getChildWHATElements = (node: WHATNode): readonly WHATElement[] => {
	if (!isWHATParentNode(node)) {
		return [];
	}

	return Array.from(node.children satisfies Iterable<Element> as Iterable<WHATElement>);
};
