import type { Evaluator } from '../../evaluator/Evaluator.ts';
import type { XPathDOMAdapter } from './XPathDOMAdapter.ts';
import type { XPathNode, XPathNodeKindKey } from './XPathNode.ts';

/**
 * @see {@link XPathCustomUnwrappableNode}
 */
declare const UnwrappedAdapterNode: unique symbol;
type UnwrappedAdapterNode = typeof UnwrappedAdapterNode;

/**
 * **!!! HERE BE DRAGONS !!!**
 *
 * Provides type-level support for {@link XPathDOMAdapter} implementations which
 * operate on representations of {@link XPathNode} outside their control
 * (typically as provided by either the runtime platform, or by a third party
 * package). It may not be feasible to assign an {@link XPathNodeKindKey}
 * property **at runtime**. In turn, this creates a conflict with the
 * {@link XPathDOMAdapter} and {@link XPathNode} **types**.
 *
 * This conflict can be addressed **within** an adapter implementation by
 * applying type assertions. Example:
 *
 * ```ts
 * interface AdapterDocument extends PlatformDocument, XPathDocument {}
 *
 * declare const platformDocument: PlatformDocument;
 * const adapterDocument: AdapterDocument = platformDocument satisfies PlatformDocument as AdapterDocument;
 * ```
 *
 * Unfortunately, this **also** creates a type-level conflict for consumers of
 * the adapter, when interacting with other `@getodk/xpath` APIs, such as
 * {@link Evaluator} or any of its subclasses. There, it would be less than
 * ideal to require users to perform the same sort of type assertions: the types
 * are already correct _for their usage_ without such special casting logic.
 *
 * The {@link XPathNodeKindKey} property is a type-level implementation detail
 * **between {@link XPathDOMAdapter} and {@link Evaluator}**, which should not
 * concern end uers.
 *
 * To address this, adapter implementations may also extend their
 * platform-/third party-provided node types with this custom unwrappable type,
 * supplying the original base type which is expected from end users. Example:
 *
 * ```ts
 * interface AdapterDocument extends PlatformDocument,
 *   XPathDocument,
 *   XPathCustomUnwrappableNode<PlatformDocument> {}
 * ```
 *
 * This directs the end user-facing interfaces to accept the unwrapped type
 * (`PlatformDocument` in the example above) anywhere the adapter's
 * {@link XPathNode} representation would otherwise be accepted.
 */
export interface XPathCustomUnwrappableNode<T> {
	readonly [UnwrappedAdapterNode]: T;
}

// prettier-ignore
export type UnwrapAdapterNode<T extends XPathNode> =
	T extends XPathCustomUnwrappableNode<infer U>
		? U
		: Omit<T, XPathNodeKindKey>;
