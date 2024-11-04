import type { XPathDOMAdapter } from '@getodk/xpath';
import type { EngineXPathNode } from './kind.ts';
import { getEngineXPathNodeKind, isEngineXPathNode } from './kind.ts';
import {
	compareDocumentOrder,
	getChildElements,
	getChildNodes,
	getContainingEngineXPathDocument,
	getEngineXPathAttributes,
	getNamespaceDeclarations,
	getNextSiblingElement,
	getNextSiblingNode,
	getParentNode,
	getPreviousSiblingElement,
	getPreviousSiblingNode,
	isDescendantNode,
} from './traversal.ts';
import { getEngineXPathNodeValue } from './values.ts';

export interface EngineDOMAdapter extends XPathDOMAdapter<EngineXPathNode> {}

// @ts-expect-error - temporary to break adapter implementation into separate commits
export const engineDOMAdapter: EngineDOMAdapter = {
	// XPathNodeKindAdapter
	getNodeKind: getEngineXPathNodeKind,
	isXPathNode: isEngineXPathNode,

	// XPathValueAdapter
	getNodeValue: getEngineXPathNodeValue,

	// XPathTraversalAdapter
	compareDocumentOrder,
	getAttributes: getEngineXPathAttributes,
	getChildElements: getChildElements,
	getChildNodes: getChildNodes,
	getContainingDocument: getContainingEngineXPathDocument,
	getNamespaceDeclarations: getNamespaceDeclarations,
	getNextSiblingElement: getNextSiblingElement,
	getNextSiblingNode: getNextSiblingNode,
	getParentNode: getParentNode,
	getPreviousSiblingElement: getPreviousSiblingElement,
	getPreviousSiblingNode: getPreviousSiblingNode,
	isDescendantNode: isDescendantNode,
};
