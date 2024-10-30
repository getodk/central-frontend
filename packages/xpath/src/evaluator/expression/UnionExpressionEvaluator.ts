import { chain } from 'itertools-ts/lib/multi';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import { distinct } from '../../lib/iterators/common.ts';
import type { UnionExprNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { LocationPathExpressionEvaluator } from './LocationPathExpressionEvaluator.ts';
import { createExpression } from './factory.ts';

export class UnionExpressionEvaluator extends LocationPathExpressionEvaluator {
	readonly lhs: ExpressionEvaluator;
	readonly rhs: ExpressionEvaluator;

	constructor(readonly syntaxNode: UnionExprNode) {
		super();

		const [lhsNode, rhsNode] = syntaxNode.children;

		this.lhs = createExpression(lhsNode);
		this.rhs = createExpression(rhsNode);
	}

	evaluateNodes<T extends XPathNode>(context: EvaluationContext<T>): Iterable<T> {
		const lhs = this.lhs.evaluate(context);

		if (!(lhs instanceof LocationPathEvaluation)) {
			throw 'todo lhs not node-set result';
		}

		const rhs = this.rhs.evaluate(context);

		if (!(rhs instanceof LocationPathEvaluation)) {
			throw 'todo rhs not node-set result';
		}

		// TODO: sort in result
		// TODO: iter stuff cleanup (TODO doesn't belong here, just noting as I fix the import)
		return context.domProvider.sortInDocumentOrder(distinct(chain(lhs.nodes, rhs.nodes)));
	}
}
