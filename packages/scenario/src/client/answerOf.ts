import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyNode, RootNode } from '@getodk/xforms-engine';
import { InputNodeAnswer } from '../answer/InputNodeAnswer.ts';
import { ModelValueNodeAnswer } from '../answer/ModelValueNodeAnswer.ts.ts';
import { RankNodeAnswer } from '../answer/RankNodeAnswer.ts';
import { SelectNodeAnswer } from '../answer/SelectNodeAnswer.ts';
import { TriggerNodeAnswer } from '../answer/TriggerNodeAnswer.ts';
import { UploadNodeAnswer } from '../answer/UploadNodeAnswer.ts';
import type { ValueNodeAnswer } from '../answer/ValueNodeAnswer.ts';
import { getNodeForReference } from './traversal.ts';

const isValueNode = (node: AnyNode) => {
	return (
		node.nodeType === 'model-value' ||
		node.nodeType === 'rank' ||
		node.nodeType === 'select' ||
		node.nodeType === 'input' ||
		node.nodeType === 'trigger' ||
		node.nodeType === 'upload'
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

		case 'rank':
			return new RankNodeAnswer(node);

		case 'select':
			return new SelectNodeAnswer(node);

		case 'input':
			return new InputNodeAnswer(node);

		case 'trigger':
			return new TriggerNodeAnswer(node);

		case 'upload':
			return new UploadNodeAnswer(node);

		default:
			throw new UnreachableError(node);
	}
};
