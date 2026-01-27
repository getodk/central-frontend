import type {
	UnspecifiedNonXPathNodeKind,
	XPathAttribute,
	XPathComment,
	XPathDocument,
	XPathElement,
	XPathNamespaceDeclaration,
	XPathNode,
	XPathNodeKind,
	XPathProcessingInstruction,
	XPathText,
} from './XPathNode.ts';

export type AdapterDocument<T extends XPathNode> = Extract<T, XPathDocument>;
export type AdapterElement<T extends XPathNode> = Extract<T, XPathElement>;
export type AdapterNamespaceDeclaration<T extends XPathNode> = Extract<
	T,
	XPathNamespaceDeclaration
>;
export type AdapterAttribute<T extends XPathNode> = Extract<T, XPathAttribute>;
export type AdapterText<T extends XPathNode> = Extract<T, XPathText>;
export type AdapterComment<T extends XPathNode> = Extract<T, XPathComment>;
export type AdapterProcessingInstruction<T extends XPathNode> = Extract<
	T,
	XPathProcessingInstruction
>;

export type AdapterNode<T extends XPathNode> = AdapterChildNode<T> | AdapterParentNode<T>;

// prettier-ignore
export type AdapterParentNode<T extends XPathNode> =
	| AdapterDocument<T>
	| AdapterElement<T>;

// prettier-ignore
export type AdapterChildNode<T extends XPathNode> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| AdapterElement<T>
	| AdapterText<T>
	| AdapterComment<T>
	| AdapterAttribute<T>
	| AdapterProcessingInstruction<T>;

// prettier-ignore
export type AdapterQualifiedNamedNode<T extends XPathNode> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| AdapterElement<T>
	| AdapterAttribute<T>;

export interface XPathNodeKindAdapter<T extends XPathNode> {
	readonly isXPathNode: (value: unknown) => value is T;

	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	readonly getNodeKind: (node: T) => XPathNodeKind | UnspecifiedNonXPathNodeKind;
}
