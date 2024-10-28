/**
 * @module
 *
 * Everything in this module is temporary, to be replaced with an adapter-based
 * approach to providing DOM functionality.
 */

import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type {
	AdapterElement,
	AdapterParentNode,
} from '../adapter/interface/XPathNodeKindAdapter.ts';

/**
 * @todo this is temporary, its use will be replaced in coming commits migrating
 * to a DOM adapter design.
 */
export const DEFAULT_DOM_PROVIDER = {
	hasLocalNamedAttribute: (node: AdapterElement<XPathNode>, localName: string): boolean => {
		return node.hasAttribute(localName);
	},
	getChildrenByLocalName: <T extends XPathNode>(
		node: AdapterParentNode<T>,
		localName: string
	): Iterable<AdapterElement<T>> => {
		return (Array.from(node.children) satisfies Element[] as Array<AdapterElement<T>>).filter(
			(child) => {
				return child.localName === localName;
			}
		);
	},
	getLocalNamedAttributeValue: (
		node: AdapterElement<XPathNode>,
		localName: string
	): string | null => {
		return node.getAttribute(localName);
	},
} as const;

// @ts-expect-error - This is temporary, its use will be replaced in comming commits migrating to a DOM adapter design.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type XPathDOMProvider<T extends XPathNode> = typeof DEFAULT_DOM_PROVIDER;

declare const TEMP_UNWRAPPED_DISTINCT_UNION_HELPER: unique symbol;

export type UnwrapAdapterNode<T extends XPathNode> = T & {
	readonly [TEMP_UNWRAPPED_DISTINCT_UNION_HELPER]?: never;
};
