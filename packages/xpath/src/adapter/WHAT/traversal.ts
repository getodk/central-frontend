import type { DocumentOrderComparison } from '../interface/XPathTraversalAdapter.ts';
import type {
	WHATAttribute,
	WHATChildNode,
	WHATDocument,
	WHATElement,
	WHATNamespaceDeclaration,
	WHATNode,
	WHATParentNode,
} from './WHATNode.ts';
import {
	isWHATAttribute,
	isWHATDocument,
	isWHATElement,
	isWHATNamespaceDeclaration,
	isWHATParentNode,
} from './kind.ts';

export const getContainingWHATDocument = (node: WHATNode): WHATDocument => {
	if (isWHATDocument(node)) {
		return node;
	}

	return node.ownerDocument satisfies Document as WHATDocument;
};

// prettier-ignore
type MaybeWHATAttr =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	& WHATNode
	& Partial<WHATAttribute>

const getOwnerWHATElement = (node: WHATNode): WHATElement | null => {
	const ownerElement: Element | null = (node as MaybeWHATAttr).ownerElement ?? null;

	return ownerElement as WHATElement | null;
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

export const getWHATParentNode = (node: WHATNode): WHATParentNode | null => {
	let parentNode: ParentNode | null = getOwnerWHATElement(node);
	parentNode ??= node.parentNode;
	return parentNode as WHATParentNode | null;
};

export const getWHATChildNodes = (node: WHATNode): readonly WHATChildNode[] => {
	if (!isWHATParentNode(node)) {
		return [];
	}

	return Array.from(node.childNodes satisfies Iterable<ChildNode> as Iterable<WHATChildNode>);
};

export const getChildWHATElements = (node: WHATNode): readonly WHATElement[] => {
	if (!isWHATParentNode(node)) {
		return [];
	}

	return Array.from(node.children satisfies Iterable<Element> as Iterable<WHATElement>);
};

export const getPreviousSiblingWHATNode = (node: WHATNode): WHATChildNode | null => {
	const previousSibling = node.previousSibling satisfies ChildNode | null as WHATChildNode | null;

	return previousSibling;
};

// prettier-ignore
type MaybeWHATElementSibling =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	& WHATNode
	& Partial<WHATChildNode>;

export const getPreviousSiblingWHATElement = (node: WHATNode): WHATElement | null => {
	const previousElementSibling: Element | null =
		(node as MaybeWHATElementSibling).previousElementSibling ?? null;

	return previousElementSibling as WHATElement | null;
};

export const getNextSiblingWHATNode = (node: WHATNode): WHATChildNode | null => {
	return node.nextSibling satisfies ChildNode | null as WHATChildNode | null;
};

export const getNextSiblingWHATElement = (node: WHATNode): WHATElement | null => {
	const nextElementSibling: Element | null =
		(node as MaybeWHATElementSibling).nextElementSibling ?? null;

	return nextElementSibling as WHATElement | null;
};

export const isDescendantWHATNode = (ancestor: WHATNode, other: WHATNode) => {
	return ancestor.contains(other satisfies WHATNode as Node);
};

type WHATDocumentPositionComparableNode = Exclude<WHATNode, Attr>;

const getWHATDocumentPositionComparableNode = (
	node: WHATNode
): WHATDocumentPositionComparableNode => {
	return getOwnerWHATElement(node) ?? (node as WHATDocumentPositionComparableNode);
};

const DOCUMENT_POSITION_PRECEDING: Node['DOCUMENT_POSITION_PRECEDING'] = 0x02;
const DOCUMENT_POSITION_FOLLOWING: Node['DOCUMENT_POSITION_FOLLOWING'] = 0x04;

export const compareWHATDocumentOrder = (a: WHATNode, b: WHATNode): DocumentOrderComparison => {
	if (a === b) {
		return 0;
	}

	const compared = b.compareDocumentPosition(a);

	// Specific to jsdom(?)
	if (compared === 0) {
		if (getWHATDocumentPositionComparableNode(a) === b) {
			return 1;
		}

		if (a === getWHATDocumentPositionComparableNode(b)) {
			return -1;
		}
	}

	if (compared & DOCUMENT_POSITION_FOLLOWING) {
		return 1;
	}

	if (compared & DOCUMENT_POSITION_PRECEDING) {
		return -1;
	}

	throw new Error('Failed to compare document position');
};
