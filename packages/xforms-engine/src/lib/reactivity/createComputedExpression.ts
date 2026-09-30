import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator, Result } from '../../integration/xpath/EngineXPathEvaluator.ts';
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

type EvaluatedExpression<Type extends DependentExpressionResultType> =
  ComputedExpressionResults[Type];

type ExpressionEvaluator<Type extends DependentExpressionResultType> = (
  defaultValue?: EvaluatedExpression<Type>
) => Result<Type>;

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
      return ((_) => {
        return evaluator.evaluateBoolean(expression, options);
      }) as ExpressionEvaluator<Type>;

    case 'nodes':
      return ((defaultValue) => {
        return evaluator.evaluateNodes(expression, options) ?? defaultValue;
      }) as ExpressionEvaluator<Type>;

    case 'number':
      return ((defaultValue) => {
        const result = evaluator.evaluateNumber(expression, options);
        if (defaultValue && Number.isNaN(result)) {
          return defaultValue;
        }
        return result;
      }) as ExpressionEvaluator<Type>;

    case 'string':
      return ((defaultValue) => {
        return evaluator.evaluateString(expression, options) ?? defaultValue;
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

export type ComputedExpression<Type extends DependentExpressionResultType> = Accessor<
  EvaluatedExpression<Type>
>;

const isSameEvaluation = <Type extends DependentExpressionResultType>(
  previous: Result<Type>,
  current: Result<Type>
): boolean => {
  return previous.value === current.value && previous.error?.message === current.error?.message;
};

const evaluateOrFallback = <Type extends DependentExpressionResultType>(
  evaluate: ExpressionEvaluator<Type>,
  fallback: EvaluatedExpression<Type>,
  isAttached: boolean
): Result<Type> => {
  if (isAttached) {
    const result = evaluate();
    if (result.success) {
      return { success: true, value: result.value, error: null };
    }
    return { success: false, value: fallback, error: result.error };
  }
  const fallbackResult = evaluate(fallback);
  if (fallbackResult.success) {
    return { success: true, value: fallbackResult.value, error: null };
  }
  return { success: true, value: fallback, error: null };
};

interface CreateComputedExpressionOptions<Type extends DependentExpressionResultType> {
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

const createConstantExpression = <Type extends DependentExpressionResultType>(
  context: EvaluationContext,
  evaluation: Result<Type>
): ComputedExpression<Type> => {
  const error = () => evaluation.error;
  if (evaluation.error) {
    context.registerExpressionError(error);
  }
  return Object.assign(() => evaluation.value, { error }) as ComputedExpression<Type>;
};

const evaluateInContext = <Type extends DependentExpressionResultType>(
  context: EvaluationContext,
  dependentExpression: DependentExpression<Type>,
  options: CreateComputedExpressionOptions<Type>
): Result<Type> => {
  const { contextNode, evaluator } = context;
  const { expression, isTranslated, resultType } = dependentExpression;
  const evaluate = expressionEvaluator(evaluator, resultType, expression, { contextNode });
  const fallback = options.defaultValue ?? defaultEvaluationsByType[resultType];

  if (isConstantExpression(expression)) {
    return evaluateOrFallback(evaluate, fallback, true);
  }
  if (isTranslated) {
    context.getActiveLanguage();
  }
  return evaluateOrFallback(evaluate, fallback, context.isAttached());
};

// Evaluates in the computation of the caller, which tracks the dependencies and reads the error.
export const evaluateExpression = <Type extends DependentExpressionResultType>(
  context: EvaluationContext,
  dependentExpression: DependentExpression<Type>
): Result<Type> => {
  return evaluateInContext(context, dependentExpression, {});
};

const createReactiveExpression = <Type extends DependentExpressionResultType>(
  context: EvaluationContext,
  dependentExpression: DependentExpression<Type>,
  options: CreateComputedExpressionOptions<Type>
): ComputedExpression<Type> => {
  const evaluation = createMemo(
    () => evaluateInContext(context, dependentExpression, options),
    undefined,
    { equals: isSameEvaluation }
  );
  const error = () => evaluation().error;
  context.registerExpressionError(error);

  return Object.assign(() => evaluation().value, { error }) as ComputedExpression<Type>;
};

export const createComputedExpression = <Type extends DependentExpressionResultType>(
  context: EvaluationContext,
  dependentExpression: DependentExpression<Type>,
  options: CreateComputedExpressionOptions<Type> = {}
): ComputedExpression<Type> => {
  if (isConstantExpression(dependentExpression.expression)) {
    const evaluation = evaluateInContext(context, dependentExpression, options);
    return createConstantExpression(context, evaluation);
  }

  return context.scope.runTask(() => {
    return createReactiveExpression(context, dependentExpression, options);
  });
};
