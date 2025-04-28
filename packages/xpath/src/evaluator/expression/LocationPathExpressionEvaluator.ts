import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type { ExpressionEvaluator, ExpressionNode } from './ExpressionEvaluator.ts';

export abstract class LocationPathExpressionEvaluator implements ExpressionEvaluator {
	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateNodes<T extends XPathNode>(context: EvaluationContext<T>): ReadonlySet<T>;

	evaluate<T extends XPathNode>(context: EvaluationContext<T>): Evaluation<T, 'NODE'> {
		const locationPathContext = context.currentContext();

		return locationPathContext.evaluateLocationPathExpression(this);
	}
}
