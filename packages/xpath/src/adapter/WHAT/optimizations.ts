import type { WHATChildNode, WHATElement, WHATNode, WHATParentNode } from './WHATNode.ts';
import { getChildWHATElements, getContainingWHATDocument } from './traversal.ts';

export const getQualifiedNamedWHATAttributeValue = (
	node: WHATElement,
	namespaceURI: string | null,
	localName: string
): string | null => {
	return node.getAttributeNS(namespaceURI, localName);
};

export const getLocalNamedWHATAttributeValue = (
	node: WHATElement,
	localName: string
): string | null => {
	return node.getAttribute(localName);
};

export const hasLocalNamedWHATAttribute = (node: WHATElement, localName: string): boolean => {
	return node.hasAttribute(localName);
};

export const getWHATElementByUniqueId = (node: WHATParentNode, id: string): WHATElement | null => {
	const element: Element | null = getContainingWHATDocument(node).getElementById(id);

	return element as WHATElement | null;
};

export const getWHATChildrenByLocalName = (
	node: WHATParentNode,
	localName: string
): readonly WHATElement[] => {
	return getChildWHATElements(node).filter((element) => {
		return element.localName === localName;
	});
};

export const getFirstWHATChildNode = (node: WHATNode): WHATChildNode | null => {
	const firstChild: ChildNode | null = node.firstChild;

	return firstChild as WHATChildNode | null;
};

export const getLastWHATChildNode = (node: WHATNode): WHATChildNode | null => {
	const lastChild: ChildNode | null = node.lastChild;

	return lastChild as WHATChildNode | null;
};

// prettier-ignore
type MaybeWHATElement =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	& WHATNode
	& Partial<WHATElement>;

export const getFirstChildWHATElement = (node: WHATNode): WHATElement | null => {
	const firstElementChild: Element | null = (node as MaybeWHATElement).firstElementChild ?? null;

	return firstElementChild as WHATElement | null;
};

export const getLastChildWHATElement = (node: WHATNode): WHATElement | null => {
	const lastElementChild: Element | null = (node as MaybeWHATElement).lastElementChild ?? null;

	return lastElementChild as WHATElement | null;
};
