const { ATTRIBUTE_NODE, COMMENT_NODE, ELEMENT_NODE, TEXT_NODE } = Node;

export const isAttributeNode = (node: Node): node is Attr => node.nodeType === ATTRIBUTE_NODE;

export const isCommentNode = (node: Node): node is Comment => node.nodeType === COMMENT_NODE;

export const isElementNode = (node: Node): node is Element => node.nodeType === ELEMENT_NODE;

export const isTextNode = (node: Node): node is Text => node.nodeType === TEXT_NODE;
