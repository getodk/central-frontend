import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyNode, RepeatRangeNode } from '@getodk/xforms-engine';

export const getNodeForReference = <T extends AnyNode>(
	currentNode: AnyNode,
	reference: string
): T | null => {
	if (currentNode.currentState.reference === reference) {
		return currentNode as T;
	}

	const { children } = currentNode.currentState;

	if (children == null) {
		return null;
	}

	for (const child of children) {
		const question = getNodeForReference<T>(child, reference);

		if (question != null) {
			return question;
		}
	}

	return null;
};

export const getClosestRepeatRange = (
	fromReference: string,
	currentNode: AnyNode
): RepeatRangeNode | null => {
	switch (currentNode.nodeType) {
		case 'root':
			return null;

		case 'repeat-range':
			return currentNode;

		case 'repeat-instance':
			return currentNode.parent;

		case 'group':
		case 'subtree':
		case 'string':
		case 'select':
			return getClosestRepeatRange(fromReference, currentNode.parent);

		default:
			throw new UnreachableError(currentNode);
	}
};
