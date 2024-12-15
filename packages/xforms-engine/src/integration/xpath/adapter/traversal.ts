import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import { XPathFunctionalityPendingError } from '../../../error/XPathFunctionalityPendingError.ts';
import type { AnyNode } from '../../../instance/hierarchy.ts';
import type { AnyStaticNode, StaticNodeParent } from '../static-dom/StaticNode.ts';
import type {
	EngineXPathAttribute,
	EngineXPathDocument,
	EngineXPathElement,
	EngineXPathNode,
	EngineXPathParentNode,
	PrimaryInstanceXPathChildNode,
	XFormsXPathChildNode,
} from './kind.ts';
import { isEngineXPathElement } from './kind.ts';

export const getContainingEngineXPathDocument = (node: EngineXPathNode): EngineXPathDocument => {
	return node.rootDocument;
};

export const getEngineXPathAttributes = (node: EngineXPathNode): Iterable<EngineXPathAttribute> => {
	if (node.nodeType === 'static-element') {
		return node.attributes;
	}

	return [];
};

/**
 * @todo We've now laid most of the groundwork necessary to implement this
 * properly. At time of writing it has still been deferred because:
 *
 * 1. The scope of changes enabling it is already a fairly large yak shave.
 * 2. It is only used to support XPath LocationPath Steps whose AxisName is
 *    `namespace`. If we _ever_ support this, it would probably be for extremely
 *    niche use cases!
 *
 * @todo Since we've consciously deferred implementing this (twice now!), should
 * it throw? It might be nice to be alerted if the assumptions in point 2 above
 * are somehow wrong (or become wrong).
 */
export const getNamespaceDeclarations = (): Iterable<never> => [];

export const getParentNode = (node: EngineXPathNode): EngineXPathParentNode | null => {
	if (node.nodeType === 'repeat-instance') {
		return node.parent.parent;
	}

	return node.parent;
};

export const getChildNodes = (node: EngineXPathNode): readonly XFormsXPathChildNode[] => {
	return node.getXPathChildNodes();
};

export const getChildElements = (node: EngineXPathNode): readonly EngineXPathElement[] => {
	return getChildNodes(node).filter(isEngineXPathElement);
};

export const getPreviousSiblingNode = (node: EngineXPathNode): XFormsXPathChildNode | null => {
	const parent = getParentNode(node);

	if (parent == null) {
		return null;
	}

	let previous: EngineXPathNode | null = null;

	for (const child of getChildNodes(parent)) {
		if (child === node) {
			return previous;
		}

		previous = child;
	}

	return null;
};

export const getPreviousSiblingElement = (node: EngineXPathNode): EngineXPathElement | null => {
	const parent = getParentNode(node);

	if (parent == null) {
		return null;
	}

	let previous: EngineXPathElement | null = null;

	for (const child of getChildNodes(parent)) {
		if (child === node) {
			return previous;
		}

		if (isEngineXPathElement(child)) {
			previous = child;
		}
	}

	return null;
};

export const getNextSiblingNode = (node: EngineXPathNode): XFormsXPathChildNode | null => {
	const parent = getParentNode(node);

	if (parent == null) {
		return null;
	}

	let visitedCurrent = false;

	for (const child of getChildNodes(parent)) {
		if (child === node) {
			visitedCurrent = true;
		} else if (visitedCurrent) {
			return child;
		}
	}

	return null;
};

export const getNextSiblingElement = (node: EngineXPathNode): EngineXPathElement | null => {
	const parent = getParentNode(node);

	if (parent == null) {
		return null;
	}

	let visitedCurrent = false;

	for (const child of getChildNodes(parent)) {
		if (child === node) {
			visitedCurrent = true;
		} else if (visitedCurrent && isEngineXPathElement(child)) {
			return child;
		}
	}

	return null;
};

const isPrimaryInstanceChildNode = (
	node: EngineXPathNode
): node is PrimaryInstanceXPathChildNode => {
	switch (node.nodeType) {
		case 'primary-instance':
		case 'static-attribute':
		case 'static-element':
		case 'static-text':
			return false;

		default:
			return true;
	}
};

const primaryInstanceElementContains = (ancestor: AnyNode, other: AnyNode): boolean => {
	if (other === ancestor) {
		return true;
	}

	const { parent, root } = other;

	if (parent == null || parent === root) {
		return false;
	}

	return primaryInstanceElementContains(ancestor, parent);
};

const staticParentNodeContains = (ancestor: StaticNodeParent, other: AnyStaticNode): boolean => {
	if (ancestor === other) {
		return false;
	}

	const { parent } = other;

	if (parent == null) {
		return false;
	}

	return staticParentNodeContains(ancestor, parent);
};

export const isDescendantNode = (ancestor: EngineXPathNode, other: EngineXPathNode) => {
	// TODO: "descendant" semantics != "contains" semantics
	if (ancestor === other) {
		return true;
	}

	if (ancestor.nodeType === 'primary-instance') {
		return isPrimaryInstanceChildNode(other);
	}

	if (other.nodeType === 'primary-instance') {
		// TODO: in the event this does somehow occur, this is not the kind of error
		// messaging we want to surface to users! It is, however, exactly the kind
		// of messaging we want to surface to us.
		throw new ErrorProductionDesignPendingError(
			'Exhaustive check failed: comparing hierarchy of two primary instance documents. It is unclear how this could ever occur. If it has, something may have gone horribly wrong!'
		);
	}

	if (isPrimaryInstanceChildNode(ancestor)) {
		return isPrimaryInstanceChildNode(other) && primaryInstanceElementContains(ancestor, other);
	}

	if (isPrimaryInstanceChildNode(other)) {
		return false;
	}

	switch (ancestor.nodeType) {
		case 'static-attribute':
		case 'static-text':
			return false;

		case 'static-document':
		case 'static-element':
			break;

		default:
			throw new UnreachableError(ancestor);
	}

	return staticParentNodeContains(ancestor, other);
};

export const compareDocumentOrder =
	XPathFunctionalityPendingError.createStubImplementation('compareDocumentOrder');
