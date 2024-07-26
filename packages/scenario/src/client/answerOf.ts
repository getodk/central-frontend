import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyNode, RootNode } from '@getodk/xforms-engine';
import { ModelValueNodeAnswer } from '../answer/ModelValueNodeAnswer.ts.ts';
import { SelectNodeAnswer } from '../answer/SelectNodeAnswer.ts';
import { StringNodeAnswer } from '../answer/StringNodeAnswer.ts';
import type { ValueNodeAnswer } from '../answer/ValueNodeAnswer.ts';
import { getNodeForReference } from './traversal.ts';

const isValueNode = (node: AnyNode) => {
	return (
		node.nodeType === 'model-value' || node.nodeType === 'select' || node.nodeType === 'string'
	);
};

export const answerOf = (instanceRoot: RootNode, reference: string): ValueNodeAnswer => {
	const node = getNodeForReference(instanceRoot, reference);

	if (node == null || !isValueNode(node)) {
		throw new Error(`Cannot get answer, not a value node: ${reference}`);
	}

	switch (node.nodeType) {
		case 'model-value':
			return new ModelValueNodeAnswer(node);

		case 'select':
			return new SelectNodeAnswer(node);

		case 'string':
			return new StringNodeAnswer(node);

		default:
			throw new UnreachableError(node);
	}
};
