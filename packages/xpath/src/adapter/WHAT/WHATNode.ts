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
