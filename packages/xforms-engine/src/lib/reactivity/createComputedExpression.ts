import { UnreachableError } from '@odk-web-forms/common/lib/error/UnreachableError.ts';
import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Accessor } from 'solid-js';
import type {
	DependentExpression,
	DependentExpressionResultType,
} from '../../expression/DependentExpression.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';

interface ComputedExpressionResults {
	readonly boolean: boolean;
	readonly nodes: Node[];
	readonly string: string;
}

// prettier-ignore
type EvaluatedExpression<
	Type extends DependentExpressionResultType
> = ComputedExpressionResults[Type];

// prettier-ignore
type ExpressionEvaluator<
	Type extends DependentExpressionResultType
> = () => EvaluatedExpression<Type>

// prettier-ignore
type ComputedExpression<Type extends DependentExpressionResultType> = Accessor<
	EvaluatedExpression<Type>
>;

const expressionEvaluator = <Type extends DependentExpressionResultType>(
	evaluator: XFormsXPathEvaluator,
	contextNode: Node,
	type: Type,
	expression: string
): ExpressionEvaluator<Type> => {
	const options = { contextNode };

	switch (type) {
		case 'boolean':
			return (() => {
				return evaluator.evaluateBoolean(expression, options);
			}) as ExpressionEvaluator<Type>;

		case 'nodes':
			return (() => {
				return evaluator.evaluateNodes(expression, options);
			}) as ExpressionEvaluator<Type>;

		case 'string':
			return (() => {
				return evaluator.evaluateString(expression, options);
			}) as ExpressionEvaluator<Type>;

		default:
			throw new UnreachableError(type);
	}
};

export const createComputedExpression = <Type extends DependentExpressionResultType>(
	context: EvaluationContext,
	dependentExpression: DependentExpression<Type>
): ComputedExpression<Type> => {
	const { contextNode, evaluator } = context;
	const { expression, resultType } = dependentExpression;

	// TODO: this will be made reactive to the expression's dependencies in a
	// subsequent commit.
	return expressionEvaluator(evaluator, contextNode, resultType, expression);
};
