import type { XPathCustomUnwrappableNode } from '../interface/XPathCustomUnwrappableNode.ts';
import type {
	XPathAttribute,
	XPathComment,
	XPathDocument,
	XPathElement,
	XPathNamespaceDeclaration,
	XPathProcessingInstruction,
	XPathText,
} from '../interface/XPathNode.ts';

export interface WHATDocument
	extends Document,
		XPathDocument,
		XPathCustomUnwrappableNode<Document> {}

export interface WHATElement extends Element, XPathElement, XPathCustomUnwrappableNode<Element> {}

export interface WHATNamespaceDeclaration
	extends Attr,
		XPathNamespaceDeclaration,
		XPathCustomUnwrappableNode<Attr> {}

export interface WHATAttribute extends Attr, XPathAttribute, XPathCustomUnwrappableNode<Attr> {}

interface WHATCDATASectionNode
	extends CDATASection,
		XPathText,
		XPathCustomUnwrappableNode<CDATASection> {}

interface WHATTextNode extends Text, XPathText, XPathCustomUnwrappableNode<Text> {}

// prettier-ignore
export type WHATText =
	| WHATCDATASectionNode
	| WHATTextNode;

export interface WHATComment extends Comment, XPathComment, XPathCustomUnwrappableNode<Comment> {}

export interface WHATProcessingInstruction
	extends ProcessingInstruction,
		XPathProcessingInstruction {}

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
