import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import type { ExpressionEvaluator, ExpressionNode } from './ExpressionEvaluator.ts';

export abstract class NumberExpressionEvaluator<ConstValue extends number | null = null>
	implements ExpressionEvaluator
{
	constructor(protected readonly constValue: ConstValue) {}

	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateNumber<T extends XPathNode>(context: EvaluationContext<T>): number;

	evaluate<T extends XPathNode>(context: EvaluationContext<T>): NumberEvaluation<T> {
		const numberValue = this.evaluateNumber(context);

		return new NumberEvaluation(context.currentContext(), numberValue);
	}
}
