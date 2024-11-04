import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../../instance/internal-api/SubscribableDependency.ts';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type {
	DependentExpression,
	DependentExpressionResultType,
} from '../../parse/expression/abstract/DependentExpression.ts';
import { isConstantExpression } from '../../parse/xpath/semantic-analysis.ts';

interface ComputedExpressionResults {
	readonly boolean: boolean;
	readonly nodes: EngineXPathNode[];
	readonly number: number;
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

interface ExpressionEvaluatorOptions {
	get contextNode(): EngineXPathNode;
}

const expressionEvaluator = <Type extends DependentExpressionResultType>(
	evaluator: EngineXPathEvaluator,
	type: Type,
	expression: string,
	options: ExpressionEvaluatorOptions
): ExpressionEvaluator<Type> => {
	switch (type) {
		case 'boolean':
			return (() => {
				return evaluator.evaluateBoolean(expression, options);
			}) as ExpressionEvaluator<Type>;

		case 'nodes':
			return (() => {
				return evaluator.evaluateNodes(expression, options);
			}) as ExpressionEvaluator<Type>;

		case 'number':
			return (() => {
				return evaluator.evaluateNumber(expression, options);
			}) as ExpressionEvaluator<Type>;

		case 'string':
			return (() => {
				return evaluator.evaluateString(expression, options);
			}) as ExpressionEvaluator<Type>;

		default:
			throw new UnreachableError(type);
	}
};

type DefaultEvaluationsByType = {
	readonly [Type in DependentExpressionResultType]: EvaluatedExpression<Type>;
};

const DEFAULT_BOOLEAN_EVALUATION = false;
const DEFAULT_NODES_EVALUATION: [] = [];
const DEFAULT_NUMBER_EVALUATION = NaN;
const DEFAULT_STRING_EVALUATION = '';

const defaultEvaluationsByType: DefaultEvaluationsByType = {
	boolean: DEFAULT_BOOLEAN_EVALUATION,
	nodes: DEFAULT_NODES_EVALUATION,
	number: DEFAULT_NUMBER_EVALUATION,
	string: DEFAULT_STRING_EVALUATION,
};

// prettier-ignore
type ComputedExpression<Type extends DependentExpressionResultType> = Accessor<
	EvaluatedExpression<Type>
>;

interface CreateComputedExpressionOptions<Type extends DependentExpressionResultType> {
	readonly arbitraryDependencies?: readonly SubscribableDependency[];

	/**
	 * If a default value is provided, {@link createComputedExpression} will
	 * produce this value for computations in a non-attached evaluation context,
	 * i.e. when evaluating an expression against a node which has not yet been
	 * appended to its parents children state (or which has since been removed
	 * from that state). A non-attached state is detected when
	 * {@link EvaluationContext.isAttached} returns false.
	 *
	 * If no default value is provided, an implicit default value is produced as
	 * appropriate for the expression's intrinsic result type.
	 *
	 * @see {@link defaultEvaluationsByType} for these implicit defaults.
	 */
	readonly defaultValue?: EvaluatedExpression<Type>;
}

export const createComputedExpression = <Type extends DependentExpressionResultType>(
	context: EvaluationContext,
	dependentExpression: DependentExpression<Type>,
	options: CreateComputedExpressionOptions<Type> = {}
): ComputedExpression<Type> => {
	return context.scope.runTask(() => {
		const { contextNode, evaluator } = context;
		const { expression, isTranslated, resultType } = dependentExpression;
		const evaluatePreInitializationDefaultValue = () => {
			return options?.defaultValue ?? defaultEvaluationsByType[resultType];
		};
		const dependencyReferences = Array.from(dependentExpression.dependencyReferences);
		const evaluateExpression = expressionEvaluator(evaluator, resultType, expression, {
			contextNode,
		});

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
			if (!context.isAttached()) {
				return evaluatePreInitializationDefaultValue();
			}

			if (isTranslated) {
				context.getActiveLanguage();
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
