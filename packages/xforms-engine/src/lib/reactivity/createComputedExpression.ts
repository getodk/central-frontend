import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type {
	DependentExpression,
	DependentExpressionResultType,
} from '../../expression/DependentExpression.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../../instance/internal-api/SubscribableDependency.ts';
import { isConstantExpression } from '../../parse/xpath/semantic-analysis.ts';

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

// prettier-ignore
type ComputedExpression<Type extends DependentExpressionResultType> = Accessor<
	EvaluatedExpression<Type>
>;

interface CreateComputedExpressionOptions {
	readonly arbitraryDependencies?: readonly SubscribableDependency[];
}

export const createComputedExpression = <Type extends DependentExpressionResultType>(
	context: EvaluationContext,
	dependentExpression: DependentExpression<Type>,
	options: CreateComputedExpressionOptions = {}
): ComputedExpression<Type> => {
	const { contextNode, evaluator, root, scope } = context;
	const { expression, isTranslated, resultType } = dependentExpression;
	const dependencyReferences = Array.from(dependentExpression.dependencyReferences);
	const evaluateExpression = expressionEvaluator(evaluator, contextNode, resultType, expression);

	return scope.runTask(() => {
		if (isConstantExpression(expression)) {
			return createMemo(evaluateExpression);
		}

		const { arbitraryDependencies = [] } = options;

		const getReferencedDependencies = createMemo(() => {
			return dependencyReferences.flatMap((reference) => {
				return context.getSubscribableDependenciesByReference(reference) ?? [];
			});
		});

		return createMemo(() => {
			if (isTranslated) {
				root.subscribe();
			}

			arbitraryDependencies.forEach((dependency) => {
				dependency.subscribe();
			});

			getReferencedDependencies().forEach((dependency) => {
				dependency.subscribe();
			});

			return evaluateExpression();
		});
	});
};
