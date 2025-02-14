import { XMLNS_NAMESPACE_URI, XMLNS_PREFIX } from '@getodk/common/constants/xmlns.ts';
import { escapeXMLText } from '../xml-serialization.ts';
import type { NamespaceDeclarationMap } from './NamespaceDeclarationMap.ts';
import type { NamespaceURI } from './QualifiedName.ts';
import { QualifiedName } from './QualifiedName.ts';

interface NamespaceDeclarationXMLSerializationOptions {
	readonly omitDefaultNamespace?: boolean;
}

export interface NamespaceDeclarationOptions {
	readonly declaredPrefix: string | null;
	readonly declaredURI: NamespaceURI;
}

/**
 * Provides a generalized representation of an XML namespace declaration, which
 * can be used for:
 *
 * - Resolution of a declared namespace URI, by its declared prefix
 * - Resolution of a declared namespace prefix associated with its namespace URI
 * - Scoped resolution of same in an arbitrary DOM-like tree of nodes (or
 *   representations thereof)
 * - Serialization of the namespace declaration as an XML representation, as
 *   part of broader XML serialization logic from an arbitrary DOM-like tree of
 *   nodes (or representations thereof)
 *
 * @see {@link NamespaceDeclarationMap} for details on scoped usage
 */
export class NamespaceDeclaration {
	private readonly serializedXML: string;

	/**
	 * A namespace is declared as either:
	 *
	 * - a "default" namespace (for which no prefix is declared, in which case
	 *   this value will be `null`)
	 *
	 * - a namespace prefix (for which the prefix can be used to reference the
	 *   declared namespace, in which case this value will be a `string`)
	 */
	readonly declaredPrefix: string | null;

	/**
	 * A namespace is declared for a {@link NamespaceURI}, i.e. either a
	 * {@link URL} or `null`, where `null` corresponds to the "null namespace"
	 * (i.e. `xmlns=""` or `xmlns:prefix=""`, in serialized XML).
	 */
	readonly declaredURI: NamespaceURI;

	constructor(options: NamespaceDeclarationOptions) {
		const { declaredPrefix, declaredURI } = options;

		/**
		 * Represents the {@link QualifiedName} **of the {@link NamespaceDeclaration} itself, used only for consistent XML serialization logic.
		 */
		let qualifiedName: QualifiedName;

		switch (declaredPrefix) {
			// Declaring a "null prefix" is equivalent to the following XML syntax:
			// `xmlns="..."`
			case null:
				qualifiedName = new QualifiedName({
					namespaceURI: XMLNS_NAMESPACE_URI,
					prefix: null,
					localName: XMLNS_PREFIX,
				});

				break;

			// Declaring a non-null prefix is equivalent to the following XML syntax:
			// `xmlns:$declaredPrefix="..."
			default:
				qualifiedName = new QualifiedName({
					namespaceURI: XMLNS_NAMESPACE_URI,
					prefix: XMLNS_PREFIX,
					localName: declaredPrefix,
				});
				break;
		}

		this.declaredPrefix = declaredPrefix;
		this.declaredURI = declaredURI;

		const serializedName = qualifiedName.getPrefixedName();
		const serializedValue = escapeXMLText(declaredURI?.href ?? '');

		this.serializedXML = ` ${serializedName}="${serializedValue}"`;
	}

	declaresNamespaceURI(namespaceURI: NamespaceURI) {
		if (namespaceURI == null) {
			return this.declaredURI === null;
		}

		return this.declaredURI?.href === namespaceURI.href;
	}

	serializeNamespaceDeclarationXML(options?: NamespaceDeclarationXMLSerializationOptions): string {
		if (options?.omitDefaultNamespace && this.declaredPrefix == null) {
			return '';
		}

		return this.serializedXML;
	}
}
