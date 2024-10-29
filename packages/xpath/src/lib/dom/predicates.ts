import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type {
	AdapterAttribute,
	AdapterNamespaceDeclaration,
} from '../../adapter/interface/XPathNodeKindAdapter.ts';
import {
	ATTRIBUTE_NODE,
	CDATA_SECTION_NODE,
	COMMENT_NODE,
	DOCUMENT_NODE,
	ELEMENT_NODE,
	PROCESSING_INSTRUCTION_NODE,
	TEXT_NODE,
} from './types.ts';

export const isAttributeNode = <T extends XPathNode>(
	node: T
): node is AdapterAttribute<T> | AdapterNamespaceDeclaration<T> => node.nodeType === ATTRIBUTE_NODE;

export const isNamespaceAttribute = <T extends XPathNode>(
	attr: AdapterAttribute<T> | AdapterNamespaceDeclaration<T>
): attr is AdapterNamespaceDeclaration<T> => attr.namespaceURI === XMLNS_NAMESPACE_URI;

export const isNamespaceNode = <T extends XPathNode>(
	node: T
): node is AdapterNamespaceDeclaration<T> => isAttributeNode(node) && isNamespaceAttribute(node);

export const isCDataSection = (node: Node): node is CDATASection =>
	node.nodeType === CDATA_SECTION_NODE;

export const isCommentNode = (node: Node): node is Comment => node.nodeType === COMMENT_NODE;

export const isDocumentNode = (node: Node): node is Document => node.nodeType === DOCUMENT_NODE;

export const isElementNode = (node: Node): node is Element => node.nodeType === ELEMENT_NODE;

export const isProcessingInstructionNode = (node: Node): node is ProcessingInstruction =>
	node.nodeType === PROCESSING_INSTRUCTION_NODE;

export const isTextNode = (node: Node): node is Text => node.nodeType === TEXT_NODE;
