import { assertParentNode } from './assertions.ts';
import { isAttributeNode, isDocumentNode, isElementNode } from './predicates.ts';
import type { ContextNode, ContextParentNode } from './types.ts';

export const getDocument = (node: Node): Document =>
	node.nodeType === Node.DOCUMENT_NODE ? (node as Document) : node.ownerDocument!;

export const getRootNode = (node: ContextNode): ContextParentNode => {
	if (isDocumentNode(node)) {
		return node;
	}

	if (isElementNode(node)) {
		const rootNode = node.getRootNode();

		assertParentNode(rootNode);

		return rootNode;
	}

	if (isAttributeNode(node)) {
		const { ownerElement } = node;

		if (ownerElement == null) {
			throw 'todo';
		}

		return getRootNode(ownerElement);
	}

	// Comment, ProcessingInstruction, Text
	const { parentElement } = node;

	if (parentElement == null) {
		throw 'todo getRootNode COMMENT | PROCESSING_INSTRUCTION | TEXT';
	}

	return getRootNode(parentElement);
};
