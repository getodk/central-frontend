import { XSD_NAMESPACE_URI, XSD_PREFIX } from '@getodk/common/constants/xmlns.ts';
import type { AnyBodyElementType } from '../body/BodyDefinition.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import { parseQualifiedNameExpression } from '../xpath/semantic-analysis.ts';
import type { BindElement } from './BindElement.ts';

/**
 * As specified by {@link https://getodk.github.io/xforms-spec/#data-types}
 */
const BIND_TYPES = [
	'string',
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

type BindTypeDefaultOverridesByBodyType = Partial<Readonly<Record<AnyBodyElementType, BindType>>>;

/**
 * As specified by {@link https://getodk.github.io/xforms-spec/#bind-attributes}
 */
const SPEC_BIND_TYPE_DEFAULT = 'string' satisfies BindType;

/**
 * If an `<upload>` is not explicitly associated with any `<bind type>`, we can do one of two things:
 *
 * - correct: default to {@link SPEC_BIND_TYPE_DEFAULT | the spec default regardless of control type}
 * - more useful and robust: default to "binary", which is the only type the spec allows for an `<upload>` control
 *
 * Asked which would be preferable, @lognaturel responded:
 *
 * > I think we should assume in the spirit of doing the most useful thing!
 */
const UPLOAD_BIND_TYPE_DEFAULT = 'binary' satisfies BindType;

const BODY_BIND_TYPE_DEFAULT_OVERRIDES = {
	upload: UPLOAD_BIND_TYPE_DEFAULT,
} as const satisfies BindTypeDefaultOverridesByBodyType;

type BodyBindTypeDefaultOverrides = typeof BODY_BIND_TYPE_DEFAULT_OVERRIDES;

type BodyBindTypeDefaultOverride = keyof BodyBindTypeDefaultOverrides;

const isBodyBindTypeDefaultOverride = (
	bodyElementType: AnyBodyElementType | null
): bodyElementType is BodyBindTypeDefaultOverride => {
	return bodyElementType != null && bodyElementType in BODY_BIND_TYPE_DEFAULT_OVERRIDES;
};

const resolveDefaultBindType = (bodyElementType: AnyBodyElementType | null): BindType => {
	if (isBodyBindTypeDefaultOverride(bodyElementType)) {
		return BODY_BIND_TYPE_DEFAULT_OVERRIDES[bodyElementType];
	}

	return SPEC_BIND_TYPE_DEFAULT;
};

const isBindType = (value: string): value is BindType => {
	return BIND_TYPES.includes(value as BindType);
};

const resolveSupportedBindType = (sourceType: string): BindType | null => {
	return isBindType(sourceType) ? sourceType : null;
};

type BindTypeAliasMapping = Readonly<Record<string, BindType>>;

const BIND_TYPE_ALIASES: BindTypeAliasMapping = {
	select1: SPEC_BIND_TYPE_DEFAULT,
	rank: SPEC_BIND_TYPE_DEFAULT,
	'odk:rank': SPEC_BIND_TYPE_DEFAULT,
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
	return SPEC_BIND_TYPE_DEFAULT;
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

const resolveBindType = (
	bodyElementType: AnyBodyElementType | null,
	bindElement: BindElement,
	sourceType: string | null
): BindType => {
	if (sourceType == null) {
		return resolveDefaultBindType(bodyElementType);
	}

	return (
		resolveSupportedBindType(sourceType) ??
		resolveAliasedBindType(sourceType) ??
		resolveNamespacedBindType(bindElement, sourceType) ??
		resolveUnsupportedBindType(sourceType)
	);
};

export class BindTypeDefinition<T extends BindType = BindType> {
	static from<T extends BindType>(
		form: XFormDefinition,
		nodeset: string,
		bindElement: BindElement
	): BindTypeDefinition<T> {
		const bodyElementType = form.body.getBodyElementType(nodeset);
		const sourceType = bindElement.getAttribute('type');
		const resolved = resolveBindType(
			bodyElementType,
			bindElement,
			sourceType
		) satisfies BindType as T;

		return new this(sourceType, resolved);
	}

	private constructor(
		readonly source: string | null,
		readonly resolved: T
	) {}
}
