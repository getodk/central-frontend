import { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { UnspecifiedNonXPathNodeKind, XPathNodeKind } from '../interface/XPathNode.ts';
import { getNodeConstructor } from './platform.ts';
import type {
	WHATAttribute,
	WHATDocument,
	WHATElement,
	WHATNamespaceDeclaration,
	WHATNode,
	WHATParentNode,
} from './WHATNode.ts';

type DOCUMENT_NODE = Node['DOCUMENT_NODE'];
const DOCUMENT_NODE: DOCUMENT_NODE = 9;

type ELEMENT_NODE = Node['ELEMENT_NODE'];
const ELEMENT_NODE: ELEMENT_NODE = 1;

type ATTRIBUTE_NODE = Node['ATTRIBUTE_NODE'];
const ATTRIBUTE_NODE: ATTRIBUTE_NODE = 2;

type TEXT_NODE = Node['TEXT_NODE'];
const TEXT_NODE: TEXT_NODE = 3;

type CDATA_SECTION_NODE = Node['CDATA_SECTION_NODE'];
const CDATA_SECTION_NODE: CDATA_SECTION_NODE = 4;

type COMMENT_NODE = Node['COMMENT_NODE'];
const COMMENT_NODE: COMMENT_NODE = 8;

type PROCESSING_INSTRUCTION_NODE = Node['PROCESSING_INSTRUCTION_NODE'];
const PROCESSING_INSTRUCTION_NODE: PROCESSING_INSTRUCTION_NODE = 7;

type DOCUMENT_TYPE_NODE = Node['DOCUMENT_TYPE_NODE'];
const DOCUMENT_TYPE_NODE: DOCUMENT_TYPE_NODE = 10;

// prettier-ignore
type WHATNodeKind =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| XPathNodeKind
	| UnspecifiedNonXPathNodeKind;

const isUnknownWHATNode = (value: unknown): value is Node => {
	return value instanceof getNodeConstructor();
};

const getOptionalNodeKind = (value: unknown): WHATNodeKind | null => {
	if (!isUnknownWHATNode(value)) {
		return null;
	}

	const node = value satisfies Node;

	switch (node.nodeType) {
		case DOCUMENT_NODE:
			return 'document';

		case DOCUMENT_TYPE_NODE:
			return 'UNSPECIFIED_NON_XPATH_NODE';

		case ELEMENT_NODE:
			return 'element';

		case ATTRIBUTE_NODE:
			if ((node as Attr).namespaceURI === XMLNS_NAMESPACE_URI) {
				return 'namespace_declaration';
			}

			return 'attribute';

		case TEXT_NODE:
		case CDATA_SECTION_NODE:
			return 'text';

		case COMMENT_NODE:
			return 'comment';

		case PROCESSING_INSTRUCTION_NODE:
			return 'processing_instruction';

		default:
			return null;
	}
};

export const getWHATNodeKind = (node: WHATNode): WHATNodeKind => {
	const nodeKind = getOptionalNodeKind(node);

	if (nodeKind == null) {
		throw new Error(`Unsupported WHAT node type: ${node.nodeType}`);
	}

	return nodeKind;
};

export const isWHATNode = (value: unknown): value is WHATNode => {
	const nodeKind = getOptionalNodeKind(value);

	return nodeKind != null && nodeKind !== 'UNSPECIFIED_NON_XPATH_NODE';
};

export const isWHATDocument = (node: WHATNode): node is WHATDocument => {
	return node.nodeType === DOCUMENT_NODE;
};

export const isWHATElement = (node: WHATNode): node is WHATElement => {
	return node.nodeType === ELEMENT_NODE;
};

export const isWHATNamespaceDeclaration = (
	node: Attr | WHATNode
): node is WHATNamespaceDeclaration => {
	return node.nodeType === ATTRIBUTE_NODE && (node as Attr).namespaceURI === XMLNS_NAMESPACE_URI;
};

export const isWHATAttribute = (node: Attr | WHATNode): node is WHATAttribute => {
	return node.nodeType === ATTRIBUTE_NODE && (node as Attr).namespaceURI !== XMLNS_NAMESPACE_URI;
};

export const isWHATParentNode = (node: WHATNode): node is WHATParentNode => {
	return isWHATDocument(node) || isWHATElement(node);
};
