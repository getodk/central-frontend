import { JAVAROSA_NAMESPACE_URI, XFORMS_NAMESPACE_URI } from '../../constants/xmlns.ts';

const parser = new DOMParser();

export const xml = (parts: TemplateStringsArray, ...rest: readonly unknown[]): XMLDocument => {
	const source = String.raw(parts, ...rest).trim();

	return parser.parseFromString(source, 'text/xml');
};

export const element = (parts: TemplateStringsArray, ...rest: readonly unknown[]): Element => {
	const { documentElement } = xml(parts, ...rest);

	return documentElement;
};

export const xformsElement = (
	parts: TemplateStringsArray,
	...rest: readonly unknown[]
): Element => {
	// Wrapped in an outer element which sets `xmlns`, so that namespace
	// comparisons *do* match but attributes *do not* mismatch (because `xmlns`
	// *is* a DOM attribute, even if it isn't an attribute in most other XML
	// domain contexts...)
	const { firstElementChild } = element/* xml */ `
		<ns
			xmlns="${XFORMS_NAMESPACE_URI}"
			xmlns:jr="${JAVAROSA_NAMESPACE_URI}"
		>
			${String.raw(parts, ...rest)}
		</ns>
	`;

	return firstElementChild!;
};
