import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type { ExpressionEvaluator, ExpressionNode } from './ExpressionEvaluator.ts';

export abstract class LocationPathExpressionEvaluator implements ExpressionEvaluator {
	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateNodes(context: EvaluationContext): Iterable<Node>;

	evaluate(context: EvaluationContext): Evaluation<'NODE'> {
		const locationPathContext = context.currentContext();

		return locationPathContext.evaluateLocationPathExpression(this);
	}
}
