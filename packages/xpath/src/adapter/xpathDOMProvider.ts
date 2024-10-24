import type { XPathDOMAdapter } from './interface/XPathDOMAdapter.ts';
import type { XPathNode } from './interface/XPathNode.ts';

export interface XPathDOMProvider<T extends XPathNode> extends XPathDOMAdapter<T> {}

export const xpathDOMProvider = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): XPathDOMProvider<T> => {
	return adapter;
};
