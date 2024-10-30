import type { XPathDOMAdapter } from '../interface/XPathDOMAdapter.ts';
import { getWHATNodeKind, isWHATNode } from './kind.ts';
import { getWHATLocalName, getWHATNamespaceURI, resolveWHATNamespaceURI } from './names.ts';
import {
	getLocalNamedWHATAttributeValue,
	getWHATChildrenByLocalName,
	hasLocalNamedWHATAttribute,
} from './optimizations.ts';
import {
	getChildWHATElements,
	getContainingWHATDocument,
	getWHATAttributes,
	getWHATNamespaceDeclarations,
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
	resolveNamespaceURI: resolveWHATNamespaceURI,

	// XPathValueAdapter
	getNodeValue: getWHATNodeValue,

	// XPathTraversalAdapter
	getAttributes: getWHATAttributes,
	getChildElements: getChildWHATElements,
	getContainingDocument: getContainingWHATDocument,
	getNamespaceDeclarations: getWHATNamespaceDeclarations,

	// XPathDOMOptimizableOperations
	getChildrenByLocalName: getWHATChildrenByLocalName,
	getLocalNamedAttributeValue: getLocalNamedWHATAttributeValue,
	hasLocalNamedAttribute: hasLocalNamedWHATAttribute,
};
