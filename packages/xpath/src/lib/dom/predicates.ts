import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { NamespaceAttribute } from './types';
import {
	ATTRIBUTE_NODE,
	CDATA_SECTION_NODE,
	COMMENT_NODE,
	DOCUMENT_NODE,
	ELEMENT_NODE,
	PROCESSING_INSTRUCTION_NODE,
	TEXT_NODE,
} from './types.ts';

export const isAttributeNode = (node: Node): node is Attr => node.nodeType === ATTRIBUTE_NODE;

export const isNamespaceAttribute = (attr: Attr): attr is NamespaceAttribute =>
	attr.namespaceURI === XMLNS_NAMESPACE_URI;

export const isNamespaceNode = (node: Node): node is NamespaceAttribute =>
	isAttributeNode(node) && isNamespaceAttribute(node);

export const isCDataSection = (node: Node): node is CDATASection =>
	node.nodeType === CDATA_SECTION_NODE;

export const isCommentNode = (node: Node): node is Comment => node.nodeType === COMMENT_NODE;

export const isDocumentNode = (node: Node): node is Document => node.nodeType === DOCUMENT_NODE;

export const isElementNode = (node: Node): node is Element => node.nodeType === ELEMENT_NODE;

export const isProcessingInstructionNode = (node: Node): node is ProcessingInstruction =>
	node.nodeType === PROCESSING_INSTRUCTION_NODE;

export const isTextNode = (node: Node): node is Text => node.nodeType === TEXT_NODE;
