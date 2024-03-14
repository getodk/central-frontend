import type { NumberNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { NumberExpressionEvaluator } from './NumberExpressionEvaluator.ts';

export class NumberLiteralExpressionEvaluator
	extends NumberExpressionEvaluator<number>
	implements ExpressionEvaluator
{
	constructor(readonly syntaxNode: NumberNode) {
		const { text } = syntaxNode;

		const constValue = Number(text);

		super(constValue);
	}

	evaluateNumber(): number {
		return this.constValue;
	}
}
