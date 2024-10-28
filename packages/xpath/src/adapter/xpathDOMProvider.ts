import type { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { XPathDOMProvider as TempDOMProvider } from '../temp/dom-abstraction.ts';
import { DEFAULT_DOM_PROVIDER as tempDOMProvider } from '../temp/dom-abstraction.ts';
import type { XPathDOMAdapter } from './interface/XPathDOMAdapter.ts';
import type { XPathNode } from './interface/XPathNode.ts';
import type { AdapterParentNode, XPathNodeKindAdapter } from './interface/XPathNodeKindAdapter.ts';

type AssertXPathNode<T extends XPathNode> = <U>(
	value: U,
	message?: string
) => asserts value is Extract<U, T>;

type AssertParentNode<T extends XPathNode> = <U>(
	value: U,
	message?: string
) => asserts value is Extract<U, AdapterParentNode<T>>;

type NodeKindPredicate<T extends XPathNode, U extends T> = (node: T) => node is U;

/**
 * Provides frequently used type guards for narrowing an
 * {@link XPathDOMAdapter}'s node representation to either:
 *
 * - A valid context node (as provided to evaluation API call sites)
 * - Any one distinct semantic kind of XPath node
 * - Useful unions of any subset thereof
 */
interface NodeKindGuards<T extends XPathNode> {
	readonly assertXPathNode: AssertXPathNode<T>;
	readonly assertParentNode: AssertParentNode<T>;
}

interface ExtendedNodeKindGuards<T extends XPathNode>
	extends NodeKindGuards<T>,
		XPathDOMAdapter<T> {}

/**
 * Derives frequently used {@link NodeKindGuards | node kind predicates}
 * from an {@link XPathDOMAdapter}'s
 * {@link XPathNodeKindAdapter.getNodeKind | getNodeKind} implementation.
 */
const extendNodeKindGuards = <T extends XPathNode>(
	base: XPathDOMAdapter<T>
): ExtendedNodeKindGuards<T> => {
	const assertXPathNode: AssertXPathNode<T> = (value, message = 'Invalid context node') => {
		if (!base.isXPathNode(value)) {
			throw new Error(message);
		}
	};

	const isParentNode: NodeKindPredicate<T, AdapterParentNode<T>> = (
		value: T
	): value is AdapterParentNode<T> => {
		const kind = base.getNodeKind(value);

		return kind === 'document' || kind === 'element';
	};

	const extensions: NodeKindGuards<T> = {
		assertXPathNode,
		assertParentNode: (value, message = 'Invalid parent node') => {
			assertXPathNode(value);

			if (!isParentNode(value)) {
				throw new Error(message);
			}
		},
	};

	return Object.assign(base, extensions);
};

/**
 * An {@link XPathDOMProvider} is a superset of the {@link XPathDOMAdapter}
 * interface. As such, a derived provider is assignable anywhere an adapter (or
 * subset thereof) is expected. We assign this symbol as a means to check
 * whether the adapter passed to {@link xpathDOMProvider} is already a derived
 * provider. Checking for the symbol (via {@link isXPathDOMProvider}) is
 * sufficient, because this symbol is module local and therefore is only ever
 * assigned as part of a first pass through {@link xpathDOMProvider}.
 *
 * While repeated derivation of a DOM provider is not especially likely, and
 * would probably not be particularly expensive even if it did occur, _this is
 * not just an optimization!_ A few other `@getodk/xpath` internals depend on an
 * **identity check** of a given {@link XPathDOMProvider} object as part of
 * broader guard/assertion logic.
 *
 * (An alternate approach to achieve the same thing would involve assigning both
 * the adapter and the provider as keys e.g. in an {@link UpsertableMap} cache,
 * but that would exaggerate the performance consideration, obscuring the intent
 * to preserve object identity.)
 */
const DERIVED_DOM_PROVIDER = Symbol('DERIVED_DOM_PROVIDER');

/**
 * @see {@link DERIVED_DOM_PROVIDER}
 */
interface DerivedDOMProvider {
	readonly [DERIVED_DOM_PROVIDER]: true;
}

/**
 * @see {@link DERIVED_DOM_PROVIDER}
 */
const derivedDOMProvider = <T>(base: T): DerivedDOMProvider & T => {
	return Object.assign({}, base, {
		[DERIVED_DOM_PROVIDER]: true as const,
	});
};

interface TempDOMAbstractionBridge<T extends XPathNode>
	extends XPathDOMAdapter<T>,
		NodeKindGuards<T>,
		TempDOMProvider<T> {}

export interface XPathDOMProvider<T extends XPathNode>
	extends XPathDOMAdapter<T>,
		NodeKindGuards<T>,
		TempDOMAbstractionBridge<T>,
		DerivedDOMProvider {}

/**
 * @see {@link DERIVED_DOM_PROVIDER}
 */
const isXPathDOMProvider = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): adapter is XPathDOMProvider<T> => {
	return DERIVED_DOM_PROVIDER in adapter && adapter[DERIVED_DOM_PROVIDER] === true;
};

export const xpathDOMProvider = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): XPathDOMProvider<T> => {
	if (isXPathDOMProvider(adapter)) {
		// eslint-disable-next-line no-console
		console.warn(
			'Repeat call to xpathDOMProvider: provider has already been derived from provided adapter'
		);

		return adapter;
	}

	const extendedGuards = extendNodeKindGuards(adapter);
	const tempDOMAbstractionBridge = Object.assign(extendedGuards, tempDOMProvider);

	return derivedDOMProvider(tempDOMAbstractionBridge);
};
