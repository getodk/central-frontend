export type BindNodeset = string;

export interface BindElement {
	readonly localName: 'bind';

	getAttribute(name: 'nodeset'): BindNodeset;
	getAttribute(name: string): string | null;
	getAttributeNS(namespaceURI: string | null, localName: string): string | null;
}
