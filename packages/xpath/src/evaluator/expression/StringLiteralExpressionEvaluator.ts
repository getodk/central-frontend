import type { LiteralNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { StringExpressionEvaluator } from './StringExpressionEvaluator.ts';

export class StringLiteralExpressionEvaluator
	extends StringExpressionEvaluator<string>
	implements ExpressionEvaluator
{
	constructor(readonly syntaxNode: LiteralNode) {
		const { text } = syntaxNode;
		const constValue = text.substring(1, text.length - 1);

		super(constValue);
	}

	evaluateString(): string {
		return this.constValue;
	}
}
