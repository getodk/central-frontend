import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { NamedNodeDefinition } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { escapeXMLText } from '../../lib/xml-serialization.ts';
import type { RootDefinition } from './RootDefinition.ts';

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
 */
export class RootAttributeDefinition implements NamedNodeDefinition {
	private readonly serializedXML: string;

	readonly parent: RootDefinition;
	readonly qualifiedName: QualifiedName;
	readonly value: string;

	constructor(root: RootDefinition, source: RootAttributeSource) {
		const { namespaceURI, nodeName, value } = source;

		this.parent = root;
		this.qualifiedName = new QualifiedName(source);
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
