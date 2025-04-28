import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
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

	evaluateNodes<T extends XPathNode>(context: EvaluationContext<T>): ReadonlySet<T> {
		const lhs = this.lhs.evaluate(context);

		if (!(lhs instanceof LocationPathEvaluation)) {
			throw 'todo lhs not node-set result';
		}

		const rhs = this.rhs.evaluate(context);

		if (!(rhs instanceof LocationPathEvaluation)) {
			throw 'todo rhs not node-set result';
		}

		const nodes = Array.from(new Set([...lhs.nodes, ...rhs.nodes]));

		return new Set(nodes.slice().sort(context.domProvider.compareDocumentOrder));
	}
}
