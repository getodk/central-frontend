import {
	type AnchorMarkdownNode,
	type ChildMarkdownNode as ClientChildMarkdownNode,
	type HtmlMarkdownNode as ClientHtmlMarkdownNode,
	type ParentMarkdownNode as ClientParentMarkdownNode,
	type StyledMarkdownNode as ClientStyledMarkdownNode,
	type ElementName,
	type MarkdownNode,
	type MarkdownProperty,
} from '../../client';

abstract class ParentMarkdownNode implements ClientParentMarkdownNode {
	readonly children;
	readonly role = 'parent';
	abstract elementName: ElementName;
	constructor(children: MarkdownNode[]) {
		this.children = children;
	}
}

export class Heading1 extends ParentMarkdownNode {
	readonly elementName = 'h1';
}

export class Heading2 extends ParentMarkdownNode {
	readonly elementName = 'h2';
}

export class Heading3 extends ParentMarkdownNode {
	readonly elementName = 'h3';
}

export class Heading4 extends ParentMarkdownNode {
	readonly elementName = 'h4';
}

export class Heading5 extends ParentMarkdownNode {
	readonly elementName = 'h5';
}

export class Heading6 extends ParentMarkdownNode {
	readonly elementName = 'h6';
}

export class Strong extends ParentMarkdownNode {
	readonly elementName = 'strong';
}

export class Underline extends ParentMarkdownNode {
	readonly elementName = 'u';
}

export class Emphasis extends ParentMarkdownNode {
	readonly elementName = 'em';
}

export class OrderedList extends ParentMarkdownNode {
	readonly elementName = 'ol';
}

export class UnorderedList extends ParentMarkdownNode {
	readonly elementName = 'ul';
}

export class ListItem extends ParentMarkdownNode {
	readonly elementName = 'li';
}

export class Anchor extends ParentMarkdownNode implements AnchorMarkdownNode {
	readonly elementName = 'a';
	readonly url: string;
	constructor(children: MarkdownNode[], url: string) {
		super(children);
		this.url = url;
	}
}

abstract class StyledMarkdownNode implements ClientParentMarkdownNode {
	readonly children;
	readonly role = 'parent';
	abstract elementName: ElementName;
	readonly properties: MarkdownProperty | undefined;
	constructor(children: MarkdownNode[], properties: MarkdownProperty | undefined) {
		this.children = children;
		this.properties = properties;
	}
}

export class Paragraph extends StyledMarkdownNode implements ClientStyledMarkdownNode {
	readonly elementName = 'p';
}

export class Span extends StyledMarkdownNode implements ClientStyledMarkdownNode {
	readonly elementName = 'span';
}

export class Div extends StyledMarkdownNode implements ClientStyledMarkdownNode {
	readonly elementName = 'div';
}

export class ChildMarkdownNode implements ClientChildMarkdownNode {
	readonly role = 'child';
	readonly value: string;
	constructor(value: string) {
		this.value = value;
	}
}

export class Html implements ClientHtmlMarkdownNode {
	readonly role = 'html';
	readonly unsafeHtml: string;
	constructor(unsafeHtml: string) {
		this.unsafeHtml = unsafeHtml;
	}
}
