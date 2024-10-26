import type { AdapterElement, XPathNode } from '../temp/dom-abstraction.ts';

export const XFORMS_LOCAL_NAME = Symbol('XFORMS_LOCAL_NAME');
export type XFORMS_LOCAL_NAME = typeof XFORMS_LOCAL_NAME;

export const XFORMS_KNOWN_ATTRIBUTE = Symbol('XFORMS_KNOWN_ATTRIBUTE');
export type XFORMS_KNOWN_ATTRIBUTE = typeof XFORMS_KNOWN_ATTRIBUTE;

// prettier-ignore
export type XFormsElementRepresentation<
	T extends XPathNode,
	LocalName extends string,
	KnownAttribute extends string = never
> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	& AdapterElement<T>
	& { readonly [XFORMS_LOCAL_NAME]: LocalName }
	& (
			[KnownAttribute] extends [string]
				? { readonly [XFORMS_KNOWN_ATTRIBUTE]: KnownAttribute }
				: { readonly [XFORMS_KNOWN_ATTRIBUTE]?: string }
		);
