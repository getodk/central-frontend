import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';
import type { ExpressionEvaluator, ExpressionNode } from './ExpressionEvaluator.ts';

export abstract class StringExpressionEvaluator<ConstValue extends string | null = null>
	implements ExpressionEvaluator
{
	constructor(protected readonly constValue: ConstValue) {}

	abstract readonly syntaxNode: ExpressionNode;
	abstract evaluateString<T extends XPathNode>(context: EvaluationContext<T>): string;

	evaluate<T extends XPathNode>(context: EvaluationContext<T>): StringEvaluation<T> {
		const stringValue = this.evaluateString(context);

		return new StringEvaluation(context.currentContext(), stringValue);
	}
}
