import type { ContextParentNode } from './types.ts';

type AssertParentNode = (node: Node) => asserts node is ContextParentNode;

export const assertParentNode: AssertParentNode = (node) => {
	if ((node as ParentNode).children == null) {
		throw 'todo assertParentNode';
	}
};
