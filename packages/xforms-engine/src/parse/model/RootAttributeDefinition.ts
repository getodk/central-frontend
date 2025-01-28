import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { escapeXMLText } from '../../lib/xml-serialization.ts';

interface RootAttributeSource {
	readonly namespaceURI: string | null;
	readonly nodeName: string;
	readonly prefix: string | null;
	readonly localName: string;
	readonly value: string;
}

/**
 * @todo This class is named and typed to emphasize its intentionally narrow
 * usage and purpose. It **intentionally** avoids addressing the much broader
 * set of concerns around modeling attributes in primary instance/submissions.
 *
 * @todo This class technically does double duty, as it will also capture an
 * explicit namespace declaration (if {@link RootAttributeSource} is one).
 * This matches the DOM semantics from which we currently parse, but differs
 * from XML/XPath semantics (where a "namespace declaration" node is distinct
 * from an attribute node, despite having similar serialized syntax).
 */
export class RootAttributeDefinition {
	private readonly serializedXML: string;

	readonly namespaceURI: string | null;
	readonly nodeName: string;
	readonly prefix: string | null;
	readonly localName: string;
	readonly value: string;

	constructor(source: RootAttributeSource) {
		const { namespaceURI, nodeName, value } = source;

		this.namespaceURI = source.namespaceURI;
		this.nodeName = nodeName;
		this.prefix = source.prefix;
		this.localName = source.localName;
		this.value = value;

		// We serialize namespace declarations separately
		if (namespaceURI === XMLNS_NAMESPACE_URI) {
			this.serializedXML = '';
		} else {
			this.serializedXML = ` ${nodeName}="${escapeXMLText(value, true)}"`;
		}
	}

	serializeAttributeXML(): string {
		return this.serializedXML;
	}
}
