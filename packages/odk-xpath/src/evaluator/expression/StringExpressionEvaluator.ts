import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';
import type { ExpressionEvaluator, ExpressionNode } from './ExpressionEvaluator.ts';

export abstract class StringExpressionEvaluator<ConstValue extends string | null = null>
	implements ExpressionEvaluator
{
	constructor(protected readonly constValue: ConstValue) {}

	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateString(context: EvaluationContext): string;

	evaluate(context: EvaluationContext): StringEvaluation {
		const stringValue = this.evaluateString(context);

		return new StringEvaluation(context.currentContext(), stringValue);
	}
}
