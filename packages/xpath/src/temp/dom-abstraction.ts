/**
 * @module
 *
 * Everything in this module is temporary, to be replaced with an adapter-based
 * approach to providing DOM functionality.
 */

import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type {
	AdapterDocument,
	AdapterElement,
	AdapterParentNode,
	AdapterQualifiedNamedNode,
} from '../adapter/interface/XPathNodeKindAdapter.ts';

const DOCUMENT_NODE: Node['DOCUMENT_NODE'] = 9;

/**
 * @todo this is temporary, its use will be replaced in coming commits migrating
 * to a DOM adapter design.
 */
export const DEFAULT_DOM_PROVIDER = {
	getContainingDocument: (node: XPathNode): AdapterDocument<XPathNode> => {
		if (node.nodeType === DOCUMENT_NODE) {
			return node as AdapterDocument<XPathNode>;
		}

		const { ownerDocument } = node;

		if (!ownerDocument?.contains(node)) {
			throw new Error('Cannot reach containing document');
		}

		return ownerDocument as AdapterDocument<XPathNode>;
	},

	hasLocalNamedAttribute: (node: AdapterElement<XPathNode>, localName: string): boolean => {
		return node.hasAttribute(localName);
	},
	getChildrenByLocalName: (
		node: AdapterParentNode<XPathNode>,
		localName: string
	): Iterable<AdapterElement<XPathNode>> => {
		return (
			Array.from(node.children) satisfies Element[] as Array<AdapterElement<XPathNode>>
		).filter((child) => {
			return child.localName === localName;
		});
	},
	getLocalNamedAttributeValue: (
		node: AdapterElement<XPathNode>,
		localName: string
	): string | null => {
		return node.getAttribute(localName);
	},
	getNamespaceURI: (node: AdapterQualifiedNamedNode<XPathNode>): string | null => {
		return node.namespaceURI;
	},

	getNodeValue: (node: XPathNode): string => {
		return node.textContent ?? '';
	},
} as const;

// @ts-expect-error - This is temporary, its use will be replaced in comming commits migrating to a DOM adapter design.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type XPathDOMProvider<T extends XPathNode> = typeof DEFAULT_DOM_PROVIDER;

declare const TEMP_UNWRAPPED_DISTINCT_UNION_HELPER: unique symbol;

export type UnwrapAdapterNode<T extends XPathNode> = T & {
	readonly [TEMP_UNWRAPPED_DISTINCT_UNION_HELPER]?: never;
};
