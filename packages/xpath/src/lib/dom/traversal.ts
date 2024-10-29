import type {
	DefaultDOMAdapterDocument,
	DefaultDOMAdapterElement,
	DefaultDOMAdapterNode,
	DefaultDOMAdapterParentNode,
} from '../../adapter/defaults.ts';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type {
	AdapterDocument,
	AdapterElement,
	AdapterParentNode,
} from '../../adapter/interface/XPathNodeKindAdapter.ts';
import { assertParentNode } from './assertions.ts';
import { isAttributeNode, isDocumentNode, isElementNode } from './predicates.ts';
import { DOCUMENT_NODE } from './types.ts';

export const getDocument = <T extends XPathNode>(node: T): AdapterDocument<T> =>
	(node.nodeType === DOCUMENT_NODE
		? (node as Document)
		: node.ownerDocument!) as DefaultDOMAdapterDocument as AdapterDocument<T>;

export const getRootNode = <T extends XPathNode>(node: T): AdapterParentNode<T> => {
	if (isDocumentNode(node)) {
		return node as DefaultDOMAdapterDocument as AdapterDocument<T>;
	}

	if (isElementNode(node)) {
		const rootNode = node.getRootNode();

		assertParentNode(rootNode);

		return rootNode as DefaultDOMAdapterParentNode as AdapterParentNode<T>;
	}

	if (isAttributeNode(node)) {
		const { ownerElement } = node;

		if (ownerElement == null) {
			throw 'todo';
		}

		return getRootNode(ownerElement as DefaultDOMAdapterElement as AdapterElement<T>);
	}

	// Comment, ProcessingInstruction, Text
	const { parentElement } = node;

	if (parentElement == null) {
		throw 'todo getRootNode COMMENT | PROCESSING_INSTRUCTION | TEXT';
	}

	return getRootNode(parentElement as Node as DefaultDOMAdapterNode as T);
};
