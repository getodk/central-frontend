import { isWHATDocument } from './kind.ts';
import type { WHATDocument, WHATNode } from './WHATNode.ts';

export const getContainingWHATDocument = (node: WHATNode): WHATDocument => {
	if (isWHATDocument(node)) {
		return node;
	}

	return node.ownerDocument satisfies Document as WHATDocument;
};
