import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { XPathDOMProvider } from '../../adapter/xpathDOMProvider.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { BooleanResult } from './BooleanResult.ts';
import { NodeSetIteratorResult, NodeSetSnapshotResult } from './NodeSetResult.ts';
import { NumberResult } from './NumberResult.ts';
import { StringResult } from './StringResult.ts';
import type { XPathEvaluationResult, XPathEvaluationResultType } from './XPathEvaluationResult.ts';
import { XPATH_EVALUATION_RESULT } from './XPathEvaluationResult.ts';

const {
	ANY_TYPE,
	NUMBER_TYPE,
	STRING_TYPE,
	BOOLEAN_TYPE,
	UNORDERED_NODE_ITERATOR_TYPE,
	ORDERED_NODE_ITERATOR_TYPE,
	UNORDERED_NODE_SNAPSHOT_TYPE,
	ORDERED_NODE_SNAPSHOT_TYPE,
	ANY_UNORDERED_NODE_TYPE,
	FIRST_ORDERED_NODE_TYPE,
} = XPATH_EVALUATION_RESULT;

export const toXPathEvaluationResult = <T extends XPathNode>(
	domProvider: XPathDOMProvider<T>,
	resultType: XPathEvaluationResultType,
	evaluation: Evaluation<T>
): XPathEvaluationResult<T> => {
	const { nodes } = evaluation;

	switch (resultType) {
		case ANY_TYPE:
			switch (evaluation.type) {
				case 'BOOLEAN':
					return new BooleanResult(evaluation);

				case 'NUMBER':
					return new NumberResult(evaluation);

				case 'STRING':
					return new StringResult(evaluation);

				case 'NODE': {
					return new NodeSetIteratorResult(
						domProvider,
						UNORDERED_NODE_ITERATOR_TYPE,
						evaluation.nodes ?? []
					);
				}

				default:
					throw new UnreachableError(evaluation.type);
			}

		case BOOLEAN_TYPE:
			return new BooleanResult(evaluation);

		case NUMBER_TYPE:
			return new NumberResult(evaluation);

		case STRING_TYPE:
			return new StringResult(evaluation);

		case UNORDERED_NODE_ITERATOR_TYPE:
		case ORDERED_NODE_ITERATOR_TYPE:
		case ANY_UNORDERED_NODE_TYPE:
		case FIRST_ORDERED_NODE_TYPE:
			if (nodes == null) {
				throw 'todo not a node-set';
			}

			return new NodeSetIteratorResult(domProvider, resultType, nodes);

		case UNORDERED_NODE_SNAPSHOT_TYPE:
		case ORDERED_NODE_SNAPSHOT_TYPE:
			if (nodes == null) {
				throw 'todo not a node-set';
			}

			return new NodeSetSnapshotResult(domProvider, resultType, nodes);

		default:
			throw new UnreachableError(resultType);
	}
};
