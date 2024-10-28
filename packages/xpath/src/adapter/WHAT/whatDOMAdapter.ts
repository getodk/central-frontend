import type { XPathDOMAdapter } from '../interface/XPathDOMAdapter.ts';
import { getWHATNodeKind, isWHATNode } from './kind.ts';
import type { WHATNode } from './WHATNode.ts';

export interface WHATDOMAdapter extends XPathDOMAdapter<WHATNode> {}

export const whatDOMAdapter: WHATDOMAdapter = {
	// XPathNodeKindAdapter
	getNodeKind: getWHATNodeKind,
	isXPathNode: isWHATNode,
};
