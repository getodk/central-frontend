import type {
	AnchorMarkdownNode,
	HtmlMarkdownNode,
	ParentMarkdownNode,
	StyledMarkdownNode,
} from '@getodk/xforms-engine';
import DOMPurify from 'dompurify';
import type { StyleValue } from 'vue';

const DOM_PURIFY_SETTINGS = {
	ALLOWED_TAGS: [
		'b',
		'br',
		'em',
		'i',
		'li',
		'ol',
		'p',
		'span',
		'strong',
		'table',
		'td',
		'tr',
		'u',
		'ul',
	],
	ALLOWED_ATTR: ['style'],
};

export const getStylePropertyMap = (node: ParentMarkdownNode): StyleValue | undefined => {
	const properties = (node as StyledMarkdownNode).properties;
	if (properties) {
		return properties.style as StyleValue;
	}
};

export const getUrl = (node: ParentMarkdownNode): string | undefined => {
	if (node.elementName === 'a') {
		return (node as AnchorMarkdownNode).url;
	}
};

export const purify = (node: HtmlMarkdownNode): string => {
	return DOMPurify.sanitize(node.unsafeHtml, DOM_PURIFY_SETTINGS);
};
