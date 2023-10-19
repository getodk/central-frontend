import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type { FunctionCallNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { createExpression } from './factory.ts';

export class FunctionCallExpressionEvaluator implements ExpressionEvaluator {
	readonly functionName: string;
	readonly argumentExpressions: readonly ExpressionEvaluator[];

	constructor(readonly syntaxNode: FunctionCallNode) {
		const [{ text: functionName }, ...argumentNodes] = syntaxNode.children;

		this.functionName = functionName;

		this.argumentExpressions = argumentNodes.map((argumentNode) => {
			return createExpression(argumentNode);
		});
	}

	evaluate(context: EvaluationContext): Evaluation {
		const { argumentExpressions, functionName } = this;
		const { functionLibrary } = context;

		if (context.functionLibrary.has(functionName)) {
			return functionLibrary.call(functionName, context.currentContext(), argumentExpressions);
		}

		throw `todo funcion not defined: ${functionName}`;
	}
}
