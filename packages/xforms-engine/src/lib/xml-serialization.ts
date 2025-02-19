import type { NamespaceDeclarationMap } from './names/NamespaceDeclarationMap.ts';
import type { QualifiedName } from './names/QualifiedName.ts';

declare const ESCAPED_XML_TEXT_BRAND: unique symbol;

export type EscapedXMLText = string & { readonly [ESCAPED_XML_TEXT_BRAND]: true };

const ATTR_REGEX = /[&<>"]/;
const CONTENT_REGEX = /[&<>]/;

/**
 * This is based on the `escapeHTML` implementation in
 * {@link https://github.com/ryansolid/dom-expressions} (Solid's JSX transform).
 *
 * @see {@link https://github.com/ryansolid/dom-expressions/pull/27} for
 * motivation to derive this implementation approach.
 *
 * The intent is that this can be updated easily if the base implementation
 * changes. As such, some aspects of this implementation differ from some of our
 * typical code style preferences.
 *
 * Notable changes from the base implementation:
 *
 * - Formatting: automated only.
 * - Naming: the {@link text} parameter is named `html` in the base
 *   implementation. That would be confusing if preserved.
 * - Types:
 *     - Parameter types are added (of course)
 *     - Return type is branded as {@link EscapedXMLText}, to allow downstream
 *       checks that escaping has been performed. Return statements are cast
 *       accordingly.
 *     - {@link text} attempts to minimize risk of double-escaping by excluding
 *       that same branded type.
 * - The '>' character is also escaped, necessary for producing valid XML.
 *
 * As with the base implementation, we leave some characters unescaped:
 *
 * - " (double quote): except when {@link attr} is `true`.
 *
 * - ' (single quote): on the assumption that attributes are always serialized
 *   in double quotes. If we ever move this to `@getodk/common`, we'd want to
 *   reconsider this assumption.
 */
export const escapeXMLText = <Text extends string>(
	text: Exclude<Text, EscapedXMLText>,
	attr?: boolean
): EscapedXMLText => {
	const match = (attr ? ATTR_REGEX : CONTENT_REGEX).exec(text);
	if (!match) return text as string as EscapedXMLText;
	let index = 0;
	let lastIndex = 0;
	let out = '';
	let escape = '';
	for (index = match.index; index < text.length; index++) {
		switch (text.charCodeAt(index)) {
			case 34: // "
				if (!attr) continue;
				escape = '&quot;';
				break;
			case 38: // &
				escape = '&amp;';
				break;
			case 60: // <
				escape = '&lt;';
				break;
			case 62: // >
				escape = '&gt;';
				break;
			default:
				continue;
		}
		if (lastIndex !== index) out += text.substring(lastIndex, index);
		lastIndex = index + 1;
		out += escape;
	}
	return lastIndex !== index
		? ((out + text.substring(lastIndex, index)) as EscapedXMLText)
		: (out as EscapedXMLText);
};

interface SerializableElementAttribute {
	serializeAttributeXML(): string;
}

interface ElementXMLSerializationOptions {
	readonly namespaceDeclarations?: NamespaceDeclarationMap;
	readonly attributes?: readonly SerializableElementAttribute[];
}

const serializeElementNamespaceDeclarationXML = (
	namespaceDeclarations?: NamespaceDeclarationMap
): string => {
	if (namespaceDeclarations == null) {
		return '';
	}

	return Array.from(namespaceDeclarations.values())
		.map((namespaceDeclaration) => {
			return namespaceDeclaration.serializeNamespaceDeclarationXML({
				omitDefaultNamespace: true,
			});
		})
		.join('');
};

const serializeElementAttributeXML = (
	attributes?: readonly SerializableElementAttribute[]
): string => {
	if (attributes == null) {
		return '';
	}

	return attributes
		.map((attribute) => {
			return attribute.serializeAttributeXML();
		})
		.join('');
};

const serializeElementXML = (
	qualifiedName: QualifiedName,
	children: string,
	options: ElementXMLSerializationOptions = {}
): string => {
	// See JSDoc for the `getPrefixedName` method. If we find we do actually need
	// custom element (subtree) prefix resolution, we'd uncomment the argument
	// below. (Either way, at time of writing the affected tests pass where
	// expected when the option is passed. It's omitted on the presumption that it
	// would be redundant, since the nodes being serialized are already resolved
	// with the same set of namespace declarations which would affect them.)
	//
	// prettier-ignore
	const nodeName = qualifiedName.getPrefixedName(
		// options.namespaceDeclarations
	);
	const namespaceDeclarations = serializeElementNamespaceDeclarationXML(
		options.namespaceDeclarations
	);
	const attributes = serializeElementAttributeXML(options.attributes);
	const prefix = `<${nodeName}${namespaceDeclarations}${attributes}`;

	if (children === '') {
		return `${prefix}/>`;
	}

	return `${prefix}>${children}</${nodeName}>`;
};

export const serializeParentElementXML = (
	qualifiedName: QualifiedName,
	serializedChildren: readonly string[],
	options?: ElementXMLSerializationOptions
): string => {
	return serializeElementXML(qualifiedName, serializedChildren.join(''), options);
};

export const serializeLeafElementXML = (
	qualifiedName: QualifiedName,
	xmlValue: EscapedXMLText,
	options?: ElementXMLSerializationOptions
): string => {
	return serializeElementXML(qualifiedName, xmlValue.normalize(), options);
};
