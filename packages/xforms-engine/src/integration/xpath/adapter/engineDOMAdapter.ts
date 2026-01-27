import type { XPathDOMAdapter } from '@getodk/xpath';
import type { EngineXPathNode } from './kind.ts';
import { getEngineXPathNodeKind, isEngineXPathNode } from './kind.ts';
import {
	getEngineProcessingInstructionName,
	getEngineXPathNodeLocalName,
	getEngineXPathNodeNamespaceURI,
	getEngineXPathNodeQualifiedName,
	resolveEngineXPathNodeNamespaceURI,
} from './names.ts';
import {
	compareDocumentOrder,
	getAttributes,
	getChildElements,
	getChildNodes,
	getContainingEngineXPathDocument,
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

export const engineDOMAdapter: EngineDOMAdapter = {
	// XPathNodeKindAdapter
	getNodeKind: getEngineXPathNodeKind,
	isXPathNode: isEngineXPathNode,

	// XPathNameAdapter
	getLocalName: getEngineXPathNodeLocalName,
	getNamespaceURI: getEngineXPathNodeNamespaceURI,
	getQualifiedName: getEngineXPathNodeQualifiedName,
	getProcessingInstructionName: getEngineProcessingInstructionName,
	resolveNamespaceURI: resolveEngineXPathNodeNamespaceURI,

	// XPathValueAdapter
	getNodeValue: getEngineXPathNodeValue,

	// XPathTraversalAdapter
	compareDocumentOrder,
	getAttributes: getAttributes,
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
