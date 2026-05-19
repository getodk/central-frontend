export interface LocalNamedElement<LocalName extends string> extends Element {
	readonly localName: LocalName;
}

export interface KnownAttributeLocalNamedElement<
	LocalName extends string,
	KnownAttributeName extends string,
> extends LocalNamedElement<LocalName> {
	getAttribute(name: KnownAttributeName): string;
	getAttribute(name: string): string | null;
}
