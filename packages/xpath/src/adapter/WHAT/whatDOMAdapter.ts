import type { XPathDOMAdapter } from '../interface/XPathDOMAdapter.ts';
import { getWHATNodeKind, isWHATNode } from './kind.ts';
import { getWHATNamespaceURI } from './names.ts';
import { getContainingWHATDocument } from './traversal.ts';
import { getWHATNodeValue } from './values.ts';
import type { WHATNode } from './WHATNode.ts';

export interface WHATDOMAdapter extends XPathDOMAdapter<WHATNode> {}

export const whatDOMAdapter: WHATDOMAdapter = {
	// XPathNodeKindAdapter
	getNodeKind: getWHATNodeKind,
	isXPathNode: isWHATNode,

	// XPathNameAdapter
	getNamespaceURI: getWHATNamespaceURI,

	// XPathValueAdapter
	getNodeValue: getWHATNodeValue,

	// XPathTraversalAdapter
	getContainingDocument: getContainingWHATDocument,
};
