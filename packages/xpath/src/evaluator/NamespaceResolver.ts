import {
	ENKETO_NAMESPACE_URI,
	ENKETO_PREFIX,
	FN_NAMESPACE_URI,
	FN_PREFIX,
	HTML_NAMESPACE_URI,
	HTML_PREFIX,
	JAVAROSA_NAMESPACE_URI,
	JAVAROSA_PREFIX,
	ODK_NAMESPACE_URI,
	ODK_PREFIX,
	OPENROSA_XFORMS_NAMESPACE_URI,
	OPENROSA_XFORMS_PREFIX,
	XFORMS_NAMESPACE_URI,
	XFORMS_PREFIX,
	XHTML_NAMESPACE_URI,
	XML_NAMESPACE_URI,
	XML_PREFIX,
	XMLNS_NAMESPACE_URI,
	XMLNS_PREFIX,
} from '@getodk/common/constants/xmlns.ts';
import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { UnwrapAdapterNode } from '../adapter/interface/XPathCustomUnwrappableNode.ts';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type { AdapterParentNode } from '../adapter/interface/XPathNodeKindAdapter.ts';
import type { XPathDOMProvider } from '../adapter/xpathDOMProvider.ts';

export {
	ENKETO_NAMESPACE_URI,
	ENKETO_PREFIX,
	FN_NAMESPACE_URI,
	FN_PREFIX,
	HTML_NAMESPACE_URI,
	HTML_PREFIX,
	JAVAROSA_NAMESPACE_URI,
	JAVAROSA_PREFIX,
	ODK_NAMESPACE_URI,
	ODK_PREFIX,
	OPENROSA_XFORMS_NAMESPACE_URI,
	OPENROSA_XFORMS_PREFIX,
	XFORMS_NAMESPACE_URI,
	XFORMS_PREFIX,
	XHTML_NAMESPACE_URI,
	XML_NAMESPACE_URI,
	XML_PREFIX,
	XMLNS_NAMESPACE_URI,
	XMLNS_PREFIX,
};

export interface StaticNamespaces<
	DefaultPrefix extends string,
	DefaultURI extends string,
	Mapping extends Record<string, string>,
> {
	// prettier-ignore
	get<Key extends string | null>(key: Key):
		Key extends null
			? DefaultURI
		: Key extends DefaultPrefix
			? DefaultURI
		: Key extends keyof Mapping
			? Mapping[Key]
			: undefined;

	has(key: null): true;
	has(key: DefaultPrefix): true;
	has(key: keyof Mapping): true;
	has(key: string): false;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- it's not unsafe lol, it's defining the types
export class StaticNamespaces<
		DefaultPrefix extends string,
		DefaultURI extends string,
		const Mapping extends Record<string, string>,
	>
	extends Map<string | null, string>
	implements ReadonlyMap<string | null, string>
{
	constructor(
		protected defaultPrefix: DefaultPrefix,
		protected defaultURI: DefaultURI,
		namespaces: Mapping
	) {
		super([...Object.entries(namespaces), [null, defaultURI], [defaultPrefix, defaultURI]]);
	}
}

export const staticNamespaces = new StaticNamespaces('xf', XFORMS_NAMESPACE_URI, {
	[ENKETO_PREFIX]: ENKETO_NAMESPACE_URI,
	[FN_PREFIX]: FN_NAMESPACE_URI,
	[HTML_PREFIX]: XHTML_NAMESPACE_URI,
	html: XHTML_NAMESPACE_URI,
	xhtml: XHTML_NAMESPACE_URI,
	[JAVAROSA_PREFIX]: JAVAROSA_NAMESPACE_URI,
	javarosa: JAVAROSA_NAMESPACE_URI,
	[ODK_PREFIX]: ODK_NAMESPACE_URI,
	[OPENROSA_XFORMS_PREFIX]: OPENROSA_XFORMS_NAMESPACE_URI,
	'openrosa-xforms': OPENROSA_XFORMS_NAMESPACE_URI,
	[XFORMS_PREFIX]: XFORMS_NAMESPACE_URI,
	[XML_PREFIX]: XML_NAMESPACE_URI,
	[XMLNS_PREFIX]: XMLNS_NAMESPACE_URI,
});

const namespaceURIs = new UpsertableMap<
	XPathNSResolver,
	UpsertableMap<string | null, string | null>
>();

type XPathNSResolverFunction = (prefix: string | null) => string | null;

interface XPathNSResolverObject {
	readonly lookupNamespaceURI: XPathNSResolverFunction;
}

export class NamespaceResolver<T extends XPathNode> implements XPathNSResolverObject {
	private static isInstance<T extends XPathNode>(
		rootNode: AdapterParentNode<T> | UnwrapAdapterNode<AdapterParentNode<T>>,
		value: unknown
	): value is NamespaceResolver<T> {
		return value instanceof NamespaceResolver && value.rootNode === rootNode;
	}

	static from<T extends XPathNode>(
		domProvider: XPathDOMProvider<T>,
		rootNode: AdapterParentNode<T> | UnwrapAdapterNode<AdapterParentNode<T>>,
		referenceNode?: T | UnwrapAdapterNode<T> | null,
		contextResolver?: XPathNSResolver | null
	): NamespaceResolver<T> {
		if (this.isInstance(rootNode, contextResolver)) {
			return contextResolver;
		}

		return new this(
			domProvider,
			rootNode as AdapterParentNode<T>,
			(referenceNode ?? null) as T | null,
			contextResolver
		);
	}

	protected readonly contextResolver: XPathNSResolverFunction;

	private constructor(
		protected readonly domProvider: XPathDOMProvider<T>,
		protected readonly rootNode: AdapterParentNode<T>,
		protected readonly referenceNode?: T | null,
		contextResolver?: XPathNSResolver | null
	) {
		const contextResolverNode = referenceNode ?? rootNode;

		if (contextResolver == null) {
			this.contextResolver = (prefix) => {
				return domProvider.resolveNamespaceURI(contextResolverNode, prefix);
			};
		} else if (typeof contextResolver === 'function') {
			this.contextResolver = contextResolver;
		} else {
			this.contextResolver = (prefix) => contextResolver.lookupNamespaceURI(prefix);
		}
	}

	/**
	 * Note: while it is likely consistent with the **spec** to resolve a `null`
	 * prefix, it's not typical in a browser environment for the resolver to be
	 * consulted for an unprefixed name test in an XPath expression.
	 *
	 * We _may_ elect to deviate from that typical behavior, as it is the much
	 * more **obvious** behavior.
	 */
	lookupNamespaceURI(prefix: string | null) {
		return namespaceURIs
			.upsert(this.contextResolver, () => new UpsertableMap())
			.upsert(prefix, () => {
				return this.contextResolver(prefix) ?? staticNamespaces.get(prefix) ?? null;
			});
	}
}
