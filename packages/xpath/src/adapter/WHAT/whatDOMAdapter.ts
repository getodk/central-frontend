import type { XPathDOMAdapter } from '../interface/XPathDOMAdapter.ts';
import { getWHATNodeKind, isWHATNode } from './kind.ts';
import {
	getWHATLocalName,
	getWHATNamespaceURI,
	getWHATProcessingInstructionName,
	getWHATQualifiedName,
	resolveWHATNamespaceURI,
} from './names.ts';
import {
	getFirstChildWHATElement,
	getFirstWHATChildNode,
	getLastChildWHATElement,
	getLastWHATChildNode,
	getLocalNamedWHATAttributeValue,
	getQualifiedNamedWHATAttributeValue,
	getWHATChildrenByLocalName,
	getWHATElementByUniqueId,
	hasLocalNamedWHATAttribute,
} from './optimizations.ts';
import {
	compareWHATDocumentOrder,
	getChildWHATElements,
	getContainingWHATDocument,
	getNextSiblingWHATElement,
	getNextSiblingWHATNode,
	getPreviousSiblingWHATElement,
	getPreviousSiblingWHATNode,
	getWHATAttributes,
	getWHATChildNodes,
	getWHATNamespaceDeclarations,
	getWHATParentNode,
	isDescendantWHATNode,
} from './traversal.ts';
import { getWHATNodeValue } from './values.ts';
import type { WHATNode } from './WHATNode.ts';

export interface WHATDOMAdapter extends XPathDOMAdapter<WHATNode> {}

export const whatDOMAdapter: WHATDOMAdapter = {
	// XPathNodeKindAdapter
	getNodeKind: getWHATNodeKind,
	isXPathNode: isWHATNode,

	// XPathNameAdapter
	getLocalName: getWHATLocalName,
	getNamespaceURI: getWHATNamespaceURI,
	getQualifiedName: getWHATQualifiedName,
	getProcessingInstructionName: getWHATProcessingInstructionName,
	resolveNamespaceURI: resolveWHATNamespaceURI,

	// XPathValueAdapter
	getNodeValue: getWHATNodeValue,

	// XPathTraversalAdapter
	compareDocumentOrder: compareWHATDocumentOrder,
	getAttributes: getWHATAttributes,
	getChildElements: getChildWHATElements,
	getChildNodes: getWHATChildNodes,
	getContainingDocument: getContainingWHATDocument,
	getNamespaceDeclarations: getWHATNamespaceDeclarations,
	getNextSiblingElement: getNextSiblingWHATElement,
	getNextSiblingNode: getNextSiblingWHATNode,
	getParentNode: getWHATParentNode,
	getPreviousSiblingElement: getPreviousSiblingWHATElement,
	getPreviousSiblingNode: getPreviousSiblingWHATNode,
	isDescendantNode: isDescendantWHATNode,

	// XPathDOMOptimizableOperations
	getElementByUniqueId: getWHATElementByUniqueId,
	getChildrenByLocalName: getWHATChildrenByLocalName,
	getQualifiedNamedAttributeValue: getQualifiedNamedWHATAttributeValue,
	getLocalNamedAttributeValue: getLocalNamedWHATAttributeValue,
	hasLocalNamedAttribute: hasLocalNamedWHATAttribute,
	getFirstChildElement: getFirstChildWHATElement,
	getFirstChildNode: getFirstWHATChildNode,
	getLastChildElement: getLastChildWHATElement,
	getLastChildNode: getLastWHATChildNode,
};
