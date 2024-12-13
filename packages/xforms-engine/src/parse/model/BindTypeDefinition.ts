import { XSD_NAMESPACE_URI, XSD_PREFIX } from '@getodk/common/constants/xmlns.ts';
import { parseQualifiedNameExpression } from '../xpath/semantic-analysis.ts';
import type { BindElement } from './BindElement.ts';

/**
 * As specified by {@link https://getodk.github.io/xforms-spec/#bind-attributes}
 */
export const DEFAULT_BIND_TYPE = 'string';

export type DefaultBindType = typeof DEFAULT_BIND_TYPE;

/**
 * As specified by {@link https://getodk.github.io/xforms-spec/#data-types}
 */
const BIND_TYPES = [
	DEFAULT_BIND_TYPE,
	'int',
	'boolean',
	'decimal',
	'date',
	'time',
	'dateTime',
	'geopoint',
	'geotrace',
	'geoshape',
	'binary',
	'barcode',
	'intent',
] as const;

type BindTypes = typeof BIND_TYPES;

export type BindType = BindTypes[number];

const isBindType = (value: string): value is BindType => {
	return BIND_TYPES.includes(value as BindType);
};

const resolveSupportedBindType = (sourceType: string): BindType | null => {
	return isBindType(sourceType) ? sourceType : null;
};

type BindTypeAliasMapping = Readonly<Record<string, BindType>>;

/**
 * @todo should we make these aliases explicit (rather than relying on {@link resolveUnsupportedBindType})?
 *
 * - select1
 * - rank
 * - odk:rank
 */
const BIND_TYPE_ALIASES: BindTypeAliasMapping = {
	integer: 'int',
};

/**
 * @todo Should this be marked deprecated?
 * @todo Should we warn on alias resolution?
 */
const resolveAliasedBindType = (sourceType: string): BindType | null => {
	return BIND_TYPE_ALIASES[sourceType] ?? null;
};

/**
 * @todo Should we warn on this fallback?
 */
const resolveUnsupportedBindType = (_unsupportedType: string): BindType => {
	return DEFAULT_BIND_TYPE;
};

interface BindDataTypeNamespaceResolver {
	lookupNamespaceURI(prefix: string | null): string | null;
	lookupPrefix(namespaceURI: string | null): string | null;
}

/**
 * Resolves the XML Schema namespace prefix by:
 *
 * - Explicitly declared prefix, if any
 * - Default to {@link XSD_PREFIX} _unless that prefix is bound to some other
 *   namespace URI_
 */
const resolveXMLSchemaNamespacePrefix = (
	resolver: BindDataTypeNamespaceResolver
): string | null => {
	const declaredPrefix = resolver.lookupPrefix(XSD_NAMESPACE_URI);

	if (declaredPrefix != null) {
		return declaredPrefix;
	}

	if (resolver.lookupNamespaceURI(XSD_PREFIX) == null) {
		return XSD_PREFIX;
	}

	return null;
};

interface MaybeBindElementNamespaceResolver
	extends BindElement,
		Partial<BindDataTypeNamespaceResolver> {}

interface BindElementNamespaceResolver extends BindElement, BindDataTypeNamespaceResolver {}

const isNamespaceResolver = (
	bindElement: MaybeBindElementNamespaceResolver
): bindElement is BindElementNamespaceResolver => {
	return (
		typeof bindElement.lookupNamespaceURI === 'function' &&
		typeof bindElement.lookupPrefix === 'function'
	);
};

const resolveNamespacedBindType = (
	bindElement: BindElement,
	sourceType: string
): BindType | null => {
	if (!isNamespaceResolver(bindElement)) {
		return null;
	}

	const qualifiedName = parseQualifiedNameExpression(sourceType);

	if (qualifiedName == null) {
		return null;
	}

	const xsdPrefix = resolveXMLSchemaNamespacePrefix(bindElement);

	if (xsdPrefix == null) {
		return null;
	}

	const { prefix, localPart } = qualifiedName;

	if (prefix === xsdPrefix) {
		return (
			resolveSupportedBindType(localPart) ??
			resolveAliasedBindType(localPart) ??
			resolveUnsupportedBindType(localPart)
		);
	}

	return null;
};

const resolveBindType = (bindElement: BindElement, sourceType: string): BindType => {
	return (
		resolveSupportedBindType(sourceType) ??
		resolveAliasedBindType(sourceType) ??
		resolveNamespacedBindType(bindElement, sourceType) ??
		resolveUnsupportedBindType(sourceType)
	);
};

export class BindTypeDefinition<T extends BindType = BindType> {
	static from<T extends BindType>(bindElement: BindElement): BindTypeDefinition<T> {
		const sourceType = bindElement.getAttribute('type');

		if (sourceType == null) {
			return new this(sourceType, DEFAULT_BIND_TYPE);
		}

		const resolved = resolveBindType(bindElement, sourceType);

		return new this(sourceType, resolved);
	}

	private constructor(source: null, resolved: DefaultBindType);
	private constructor(source: string, resolved: BindType);
	private constructor(
		readonly source: string | null,
		readonly resolved: T
	) {}
}
