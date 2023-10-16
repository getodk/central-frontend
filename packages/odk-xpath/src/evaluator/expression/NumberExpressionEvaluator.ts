import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import type { ExpressionEvaluator, ExpressionNode } from './ExpressionEvaluator.ts';

export abstract class NumberExpressionEvaluator<ConstValue extends number | null = null>
	implements ExpressionEvaluator
{
	constructor(protected readonly constValue: ConstValue) {}

	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateNumber(context: EvaluationContext): number;

	evaluate(context: EvaluationContext): NumberEvaluation {
		const numberValue = this.evaluateNumber(context);

		return new NumberEvaluation(context.currentContext(), numberValue);
	}
}
