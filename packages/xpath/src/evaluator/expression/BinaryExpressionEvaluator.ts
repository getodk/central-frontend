import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type { AnyBinaryExprNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { createExpression } from './factory.ts';

export abstract class BinaryExpressionEvaluator<Node extends AnyBinaryExprNode>
	implements ExpressionEvaluator
{
	readonly lhs: ExpressionEvaluator;
	readonly rhs: ExpressionEvaluator;

	constructor(readonly syntaxNode: Node) {
		const [lhsNode, rhsNode] = syntaxNode.children;

		this.lhs = createExpression(lhsNode);
		this.rhs = createExpression(rhsNode);
	}

	abstract evaluate<T extends XPathNode>(context: EvaluationContext<T>): Evaluation<T>;
}
