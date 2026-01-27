import type { XPathNode } from './XPathNode.ts';
import type {
	AdapterAttribute,
	AdapterChildNode,
	AdapterDocument,
	AdapterElement,
	AdapterNamespaceDeclaration,
	AdapterNode,
} from './XPathNodeKindAdapter.ts';

export type DocumentOrderComparison = -1 | 0 | 1;

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

	readonly getNamespaceDeclarations: (node: T) => ReadonlyArray<AdapterNamespaceDeclaration<T>>;
	readonly getAttributes: (node: T) => ReadonlyArray<AdapterAttribute<T>>;
	readonly getParentNode: (node: T) => AdapterNode<T> | null;
	readonly getChildNodes: (node: T) => ReadonlyArray<AdapterChildNode<T>>;
	readonly getChildElements: (node: T) => ReadonlyArray<AdapterElement<T>>;
	readonly getPreviousSiblingNode: (node: T) => AdapterChildNode<T> | null;
	readonly getPreviousSiblingElement: (node: T) => AdapterElement<T> | null;
	readonly getNextSiblingNode: (node: T) => AdapterChildNode<T> | null;
	readonly getNextSiblingElement: (node: T) => AdapterElement<T> | null;

	/**
	 * @todo Not entirely sure this is a "traversal" API! It may use traversal to
	 * produce the result? It doesn't really belong anywhere else, and unlike
	 * values it doesn't especially feel like it warrants a separate
	 * sub-interface namespace.
	 */
	readonly compareDocumentOrder: (a: T, b: T) => DocumentOrderComparison;

	/**
	 * Determines if {@link node} is a descendant of {@link ancestor}.
	 *
	 * @todo The parameter names are doing all of the self-documentation work
	 * here. Consider a better name for this!
	 */
	readonly isDescendantNode: (ancestor: T, node: T) => boolean;
}
