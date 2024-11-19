import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import { XPathFunctionalityPendingError } from '../../../error/XPathFunctionalityPendingError.ts';
import type { AnyNode } from '../../../instance/hierarchy.ts';
import type { AnyStaticNode, StaticParentNode } from '../static-dom/StaticNode.ts';
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
 * @todo XML XForms may actually define explicit namespace declarations on
 * non-root elements (i.e. elements other than the form definition's `h:html`,
 * itext `translation`, secondary `instance`). Expressions defined in such forms
 * may also expect to use those namespace declarations. It would even seem
 * likely! Why declare namespaces on a subtree if you don't intend to use them?
 * We don't currently capture namespace declarations below `h:html` in the parse
 * stage (which, if we intend to support the use case, is where we should
 * start).
 *
 * @todo At the very least, we should probably produce a set of default namespace declarations. At least for `h:html`, maybe for other "root" nodes.
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

const staticParentNodeContains = (ancestor: StaticParentNode, other: AnyStaticNode): boolean => {
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
