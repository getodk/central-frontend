/**
 * @module
 *
 * Everything in this module is temporary, to be replaced with an adapter-based
 * approach to providing DOM functionality.
 */

import { DOCUMENT_NODE, type AnyParentNode } from '../lib/dom/types.ts';

export type XPathNode = Node;

// prettier-ignore
type SpecificAdapterNode<T extends XPathNode, U extends XPathNode = T> =
	// 1. If `T` is already `U` (or a supertype thereof)...
	T extends U

		// 2. ... it may be a wider (super) type: narrow.
		? Extract<T, U>

	// 3. OR: if `U` is narrower than `T` (likely: `U` = `T`, `T` = `XPathNode`)...
	: U extends T

		// 4. ... refine to `U` (sub) type: widen.
		? U

	// 5. ELSE: some `T`/`XPathNode` subtype which is incompatible with `U`: fail.
	: never;

export type AdapterDocument<T extends XPathNode> = SpecificAdapterNode<T, Document>;

export type AdapterElement<T extends XPathNode> = SpecificAdapterNode<T, Element>;

export type AdapterAttribute<T extends XPathNode> = SpecificAdapterNode<T, Attr>;

// prettier-ignore
export type AdapterParentNode<T extends XPathNode> =
	[T, XPathNode] extends [XPathNode, T]
		? AnyParentNode
		: never;

// prettier-ignore
export type AdapterQualifiedNamedNode<T extends XPathNode> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| AdapterElement<T>
	| AdapterAttribute<T>;

export type DefaultDOMAdapterNode = XPathNode;
export type DefaultDOMAdapterElement = AdapterElement<DefaultDOMAdapterNode>;
export type DefaultDOMAdapterParentNode = AdapterParentNode<DefaultDOMAdapterNode>;

/**
 * @todo this is temporary, its use will be replaced in coming commits migrating
 * to a DOM adapter design.
 */
export const DEFAULT_DOM_PROVIDER = {
} as const;

// @ts-expect-error - This is temporary, its use will be replaced in comming commits migrating to a DOM adapter design.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type XPathDOMProvider<T extends XPathNode> = typeof DEFAULT_DOM_PROVIDER;

declare const TEMP_UNWRAPPED_DISTINCT_UNION_HELPER: unique symbol;

export type UnwrapAdapterNode<T extends XPathNode> = T & {
	readonly [TEMP_UNWRAPPED_DISTINCT_UNION_HELPER]?: never;
};
