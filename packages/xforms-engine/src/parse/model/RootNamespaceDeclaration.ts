import { XMLNS_PREFIX } from '@getodk/common/constants/xmlns.ts';
import { escapeXMLText } from '../../lib/xml-serialization.ts';

export class RootNamespaceDeclaration {
	private readonly serializedXML: string;

	constructor(
		readonly prefix: string | null,
		readonly namespaceURI: string | null
	) {
		let serializedName: string;

		if (prefix == null) {
			serializedName = XMLNS_PREFIX;
		} else {
			serializedName = `${XMLNS_PREFIX}:${prefix}`;
		}

		const serializedValue = escapeXMLText(namespaceURI ?? '', true);

		this.serializedXML = ` ${serializedName}="${serializedValue}"`;

		this.prefix = prefix;
	}

	serializeNamespaceDeclarationXML(): string {
		return this.serializedXML;
	}
}
