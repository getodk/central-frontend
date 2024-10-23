type LookupNamespaceURI = (prefix: string | null) => string | null;

export interface XPathNamespaceResolverObject {
	readonly lookupNamespaceURI: LookupNamespaceURI;
}

export type XPathNSResolver = LookupNamespaceURI | XPathNamespaceResolverObject;
