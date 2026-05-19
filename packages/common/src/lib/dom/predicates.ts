const { ATTRIBUTE_NODE, COMMENT_NODE, DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE } = Node;

export const isAttributeNode = (node: Node): node is Attr => {
	return node.nodeType === ATTRIBUTE_NODE;
};

export const isCommentNode = (node: Node): node is Comment => {
	return node.nodeType === COMMENT_NODE;
};

type AnyDocument = Document | XMLDocument;

export const isDocumentNode = <Doc extends AnyDocument = XMLDocument>(node: Node): node is Doc => {
	return node.nodeType === DOCUMENT_NODE;
};

export const isElementNode = (node: Node): node is Element => {
	return node.nodeType === ELEMENT_NODE;
};

export const isTextNode = (node: Node): node is Text => {
	return node.nodeType === TEXT_NODE;
};
