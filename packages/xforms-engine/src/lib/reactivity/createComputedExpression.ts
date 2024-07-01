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
> = () => EvaluatedExpression<Type>;

/**
 * Handles boolean casting as expected by XForms, which deviates from standard
 * XPath semantics:
 *
 * - XForms: boolean expressions operate on the **value** of the result,
 *   potentially casting string and number values to produce a boolean result.
 *
 * - XPath: boolean evaluation of a node-set produces `true` for any non-empty
 *   node-set result, even where that node-set resolves to a single node, and
 *   where that node's value would ultimately be cast to false.
 *
 * @todo This implementation is more complex than would be ideal. There is
 * some care taken to avoid reimplementing some of the more complex casting
 * logic which is handled internally by the `xpath` package. Ultimately it
 * relies on a heuristic:
 *
 * 1. Is the result false? If so, there's no need for further casting logic.
 * 2. Is the result a node-set with multiple nodes? If so, defer to standard
 *    `xpath` casting. This is probably not what we'll want for every usage!
 * 3. Is the result a node-set with a single node (or any other single-node)
 *    result type? If so, cast the node's **value**.
 * 4. Otherwise, continue to defer to standard `xpath` casting.
 */
const booleanExpressionEvaluator = (
	evaluator: XFormsXPathEvaluator,
	contextNode: Node,
	expression: string
): ExpressionEvaluator<'boolean'> => {
	return () => {
		const anyResult = evaluator.evaluate(expression, contextNode, null, XPathResult.ANY_TYPE);
		const { booleanValue, numberValue, resultType, stringValue } = anyResult;

		if (booleanValue === false) {
			return false;
		}

		const castSingleResultValue = (): boolean => {
			if (numberValue === 0 || stringValue === '') {
				return false;
			}

			return booleanValue;
		};

		switch (resultType) {
			case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
			case XPathResult.UNORDERED_NODE_ITERATOR_TYPE: {
				let count = 0;

				while (anyResult.iterateNext() != null && count < 2) {
					count += 1;
				}

				if (count > 1) {
					return booleanValue;
				}

				return castSingleResultValue();
			}

			case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
			case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
				if (anyResult.snapshotLength > 1) {
					return booleanValue;
				}

				return castSingleResultValue();

			case XPathResult.ANY_UNORDERED_NODE_TYPE:
			case XPathResult.FIRST_ORDERED_NODE_TYPE:
			case XPathResult.STRING_TYPE: {
				return castSingleResultValue();
			}

			default:
				return booleanValue;
		}
	};
};

const expressionEvaluator = <Type extends DependentExpressionResultType>(
	evaluator: XFormsXPathEvaluator,
	contextNode: Node,
	type: Type,
	expression: string
): ExpressionEvaluator<Type> => {
	const options = { contextNode };

	switch (type) {
		case 'boolean':
			return booleanExpressionEvaluator(
				evaluator,
				contextNode,
				expression
			) as ExpressionEvaluator<Type>;

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

/**
 * Determines if an XPath expression will always produce the same value.
 *
 * @todo There are quite a few more cases than this, and it also likely belongs
 * in another `lib` module.
 */
const isConstantExpression = (expression: string): boolean => {
	const normalized = expression.replaceAll(/\s/g, '');

	return normalized === 'true()' || normalized === 'false()';
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
