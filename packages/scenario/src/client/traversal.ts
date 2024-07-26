import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyNode, RepeatRangeNode, RootNode } from '@getodk/xforms-engine';
import type { Scenario } from '../jr/Scenario.ts';

/**
 * Collects a flat list of a form instance's nodes, in an order consistent with
 * the linearly indexed progress tracked by {@link Scenario} (as preserved from
 * JavaRosa). Note that this function does not filter node types, intentionally
 * preserving nodes which would be excluded from such progress tracking. This is
 * so the same collection may be used to retrieve those nodes' values in order
 * to satisfy {@link Scenario.answerOf}, despite those nodes being omitted in
 * the final tracked linear progress state (and presumably also excluded from
 * performing writes in {@link Scenario.answer}).
 */
export const collectFlatNodeList = (currentNode: AnyNode): readonly AnyNode[] => {
	switch (currentNode.nodeType) {
		case 'root':
		case 'repeat-instance':
		case 'group':
		case 'subtree':
			return [currentNode, currentNode.currentState.children.map(collectFlatNodeList)].flat(2);

		case 'repeat-range':
			return [currentNode.currentState.children.map(collectFlatNodeList), currentNode].flat(2);

		case 'model-value':
		case 'note':
		case 'select':
		case 'string':
			return [currentNode];

		default:
			throw new UnreachableError(currentNode);
	}
};

export const getNodeForReference = (instanceRoot: RootNode, reference: string): AnyNode | null => {
	const nodes = collectFlatNodeList(instanceRoot);
	const result = nodes.find((node) => node.currentState.reference === reference);

	return result ?? null;
};

export const getClosestRepeatRange = (currentNode: AnyNode): RepeatRangeNode | null => {
	switch (currentNode.nodeType) {
		case 'root':
			return null;

		case 'repeat-range':
			return currentNode;

		case 'repeat-instance':
			return currentNode.parent;

		case 'group':
		case 'subtree':
		case 'model-value':
		case 'note':
		case 'string':
		case 'select':
			return getClosestRepeatRange(currentNode.parent);

		default:
			throw new UnreachableError(currentNode);
	}
};
