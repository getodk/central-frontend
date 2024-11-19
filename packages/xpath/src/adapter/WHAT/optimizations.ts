import type { WHATChildNode, WHATElement, WHATNode, WHATParentNode } from './WHATNode.ts';
import { getChildWHATElements, getContainingWHATDocument } from './traversal.ts';

/**
 * @todo optimization, but belongs in values.ts!
 */
export const getQualifiedNamedWHATAttributeValue = (
	node: WHATElement,
	namespaceURI: string | null,
	localName: string
): string | null => {
	return node.getAttributeNS(namespaceURI, localName);
};

/**
 * @todo optimization, but belongs in values.ts!
 */
export const getLocalNamedWHATAttributeValue = (
	node: WHATElement,
	localName: string
): string | null => {
	return node.getAttribute(localName);
};

/**
 * @todo optimization, but belongs in traversal.ts!
 */
export const hasLocalNamedWHATAttribute = (node: WHATElement, localName: string): boolean => {
	return node.hasAttribute(localName);
};

/**
 * @todo optimization, but belongs in traversal.ts!
 */
export const getWHATElementByUniqueId = (node: WHATParentNode, id: string): WHATElement | null => {
	const element: Element | null = getContainingWHATDocument(node).getElementById(id);

	return element as WHATElement | null;
};

/**
 * @todo optimization, but belongs in traversal.ts!
 */
export const getWHATChildrenByLocalName = (
	node: WHATParentNode,
	localName: string
): readonly WHATElement[] => {
	return getChildWHATElements(node).filter((element) => {
		return element.localName === localName;
	});
};

/**
 * @todo optimization, but belongs in traversal.ts!
 */
export const getFirstWHATChildNode = (node: WHATNode): WHATChildNode | null => {
	const firstChild: ChildNode | null = node.firstChild;

	return firstChild as WHATChildNode | null;
};

/**
 * @todo optimization, but belongs in traversal.ts!
 */
export const getLastWHATChildNode = (node: WHATNode): WHATChildNode | null => {
	const lastChild: ChildNode | null = node.lastChild;

	return lastChild as WHATChildNode | null;
};

// prettier-ignore
type MaybeWHATElement =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	& WHATNode
	& Partial<WHATElement>;

/**
 * @todo optimization, but belongs in traversal.ts!
 */
export const getFirstChildWHATElement = (node: WHATNode): WHATElement | null => {
	const firstElementChild: Element | null = (node as MaybeWHATElement).firstElementChild ?? null;

	return firstElementChild as WHATElement | null;
};

/**
 * @todo optimization, but belongs in traversal.ts!
 */
export const getLastChildWHATElement = (node: WHATNode): WHATElement | null => {
	const lastElementChild: Element | null = (node as MaybeWHATElement).lastElementChild ?? null;

	return lastElementChild as WHATElement | null;
};
