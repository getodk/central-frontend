export type Heading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type ElementName =
	| Heading
	| 'a'
	| 'div'
	| 'em'
	| 'li'
	| 'ol'
	| 'p'
	| 'span'
	| 'strong'
	| 'u'
	| 'ul';

export type MarkdownNode = ChildMarkdownNode | HtmlMarkdownNode | ParentMarkdownNode;

export interface ParentMarkdownNode {
	readonly role: 'parent';
	readonly elementName: string;
	readonly children: MarkdownNode[];
}

export interface ChildMarkdownNode {
	readonly role: 'child';
	readonly value: string;
}

export interface HtmlMarkdownNode {
	readonly role: 'html';
	readonly unsafeHtml: string;
}

export interface AnchorMarkdownNode extends ParentMarkdownNode {
	readonly elementName: 'a';
	readonly url: string;
}

export interface StyledMarkdownNode extends ParentMarkdownNode {
	readonly elementName: 'div' | 'p' | 'span';
	readonly properties: MarkdownProperty | undefined;
}

export interface MarkdownProperty {
	readonly style: StyleProperty;
}

export interface StyleProperty {
	readonly color: string | undefined;
	readonly 'font-family': string | undefined;
	readonly 'text-align': 'center' | 'left' | 'right' | undefined;
	readonly 'font-size': string | undefined;
}
