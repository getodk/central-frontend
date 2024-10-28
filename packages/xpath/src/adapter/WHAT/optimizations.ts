import type { WHATElement, WHATParentNode } from './WHATNode.ts';
import { getChildWHATElements } from './traversal.ts';

export const getLocalNamedWHATAttributeValue = (
	node: WHATElement,
	localName: string
): string | null => {
	return node.getAttribute(localName);
};

export const hasLocalNamedWHATAttribute = (node: WHATElement, localName: string): boolean => {
	return node.hasAttribute(localName);
};

export const getWHATChildrenByLocalName = (
	node: WHATParentNode,
	localName: string
): readonly WHATElement[] => {
	return getChildWHATElements(node).filter((element) => {
		return element.localName === localName;
	});
};
