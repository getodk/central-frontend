import { XMLNS_PREFIX } from '@getodk/common/constants/xmlns.ts';
import { escapeXMLText } from '../../lib/xml-serialization.ts';

export class RootNamespaceDeclaration {
	private readonly serializedXML: string;

	constructor(
		readonly prefix: string | null,
		readonly namespaceURI: string | null
	) {
		if (prefix == null) {
			// We intentionally omit the default namespace declaration, which is
			// consistent with both Collect and Enketo. Including it may technically
			// be more "correct", but consistency ensures we don't introduce subtle
			// problems in any namespace-aware usage downstream.
			this.serializedXML = '';
		} else {
			const name = `${XMLNS_PREFIX}:${prefix}`;
			const value = escapeXMLText(namespaceURI ?? '', true);

			this.serializedXML = ` ${name}="${value}"`;
		}
	}

	serializeNamespaceDeclarationXML(): string {
		return this.serializedXML;
	}
}
