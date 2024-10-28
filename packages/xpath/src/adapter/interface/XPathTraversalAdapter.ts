import type { XPathNode } from './XPathNode.ts';
import type { AdapterDocument } from './XPathNodeKindAdapter.ts';

export interface XPathTraversalAdapter<T extends XPathNode> {
	/**
	 * Gets the document containing {@link node}.
	 *
	 * Note: implementations are expected to operate on a fully "attached" tree of
	 * nodes, i.e. where any particular descendant node can ultimately be
	 * traversed up to the document node produced by this method. In that sense,
	 * implementations are also expected to provide this method as an explicit,
	 * mandatory optimization of that otherwise implicit expectation.
	 */
	readonly getContainingDocument: (node: T) => AdapterDocument<T>;
}
