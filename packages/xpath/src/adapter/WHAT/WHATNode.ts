import type { XPathCustomUnwrappableNode } from '../interface/XPathCustomUnwrappableNode.ts';
import type { XPathNodeKindKey } from '../interface/XPathNode.ts';

export interface WHATDocument extends Document, XPathCustomUnwrappableNode<Document> {
	readonly [XPathNodeKindKey]: 'document';
}

export interface WHATElement extends Element, XPathCustomUnwrappableNode<Element> {
	readonly [XPathNodeKindKey]: 'element';
}

export interface WHATNamespaceDeclaration extends Attr, XPathCustomUnwrappableNode<Attr> {
	readonly [XPathNodeKindKey]: 'namespace_declaration';
}

export interface WHATAttribute extends Attr, XPathCustomUnwrappableNode<Attr> {
	readonly [XPathNodeKindKey]: 'attribute';
}

export interface WHATText
	extends CDATASection,
		Text,
		XPathCustomUnwrappableNode<CDATASection | Text> {
	readonly [XPathNodeKindKey]: 'text';

	readonly nodeType: Node['CDATA_SECTION_NODE'] | Node['TEXT_NODE'];
}
export interface WHATComment extends Comment, XPathCustomUnwrappableNode<Comment> {
	readonly [XPathNodeKindKey]: 'comment';
}

export interface WHATProcessingInstruction extends ProcessingInstruction {
	readonly [XPathNodeKindKey]: 'processing_instruction';
}

type UnwrappableWHATNodeUnion<T, U> = T & XPathCustomUnwrappableNode<U>;

// prettier-ignore
export type WHATNode = UnwrappableWHATNodeUnion<
	(
		// eslint-disable-next-line @typescript-eslint/sort-type-constituents
		| WHATDocument
		| WHATElement
		| WHATNamespaceDeclaration
		| WHATAttribute
		| WHATText
		| WHATComment
		| WHATProcessingInstruction
	),
	Node
>;

// prettier-ignore
export type WHATParentNode = UnwrappableWHATNodeUnion<
	WHATDocument | WHATElement,
	ParentNode
>;

// prettier-ignore
export type WHATChildNode = UnwrappableWHATNodeUnion<
	(
		// eslint-disable-next-line @typescript-eslint/sort-type-constituents
		| WHATElement
		| WHATText
		| WHATComment
		| WHATProcessingInstruction
	),
	ChildNode
>;

// prettier-ignore
export type WHATNamedNode = UnwrappableWHATNodeUnion<
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	WHATElement | WHATAttribute,
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	Element | Attr
>;

/**
 * @todo This is temporary! It can be removed once existing WHAT Working Group
 * DOM access is fully isolated to the WHAT adapter. In so doing, it also makes
 * sense to invert the interface extension relationship and remove direct
 * {@link XPathNodeKindKey} definitions on each of the `WHAT*` interfaces. (We
 * cannot do that now, because it would create an inheritance cycle.)
 */
declare module '../interface/XPathNode.ts' {
	export interface XPathDocument extends WHATDocument {}

	export interface XPathElement extends WHATElement {}

	export interface XPathNamespaceDeclaration extends WHATNamespaceDeclaration {}

	export interface XPathAttribute extends WHATAttribute {}

	export interface XPathText extends WHATText {}

	export interface XPathComment extends WHATComment {}

	export interface XPathProcessingInstruction extends WHATProcessingInstruction {}
}
