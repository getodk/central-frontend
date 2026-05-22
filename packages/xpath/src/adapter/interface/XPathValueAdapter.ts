import type { XPathNode } from './XPathNode.ts';

/**
 * @todo Allow adapters to implement (optional) support for non-string types,
 * e.g. when the adapter's node representation already implements the type with
 * the same semantics.
 */
export interface XPathValueAdapter<T extends XPathNode> {
	readonly getNodeValue: (node: T) => string;
}
