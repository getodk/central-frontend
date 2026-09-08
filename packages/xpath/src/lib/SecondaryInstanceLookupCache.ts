import type { XPathNode } from '../adapter/interface/XPathNode';
import type { LocationPathEvaluation } from '../evaluations/LocationPathEvaluation';
import { BinaryExpressionEvaluator } from '../evaluator/expression/BinaryExpressionEvaluator';
import type { ExpressionEvaluator } from '../evaluator/expression/ExpressionEvaluator';
import { FunctionCallExpressionEvaluator } from '../evaluator/expression/FunctionCallExpressionEvaluator';
import {
  LocationPathEvaluator,
  type LocationPathNode,
} from '../evaluator/expression/LocationPathEvaluator';
import type { AnyBinaryExprNode } from '../static/grammar/SyntaxNode';

const MINIMUM_NODES_WORTH_CACHING = 10; // TODO consider changing number

const cache = new Map<string, XPathNode[]>();

const isAbsolute = (expr: ExpressionEvaluator) =>
  expr instanceof LocationPathEvaluator && expr.isAbsolute;

const getVariableOperand = (predicateExpression: BinaryExpressionEvaluator<AnyBinaryExprNode>) => {
  // TODO Restrict this to less than AnyBinaryExprNode
  return [predicateExpression.lhs, predicateExpression.rhs].find((side) => {
    return (
      isAbsolute(side) ||
      (side instanceof FunctionCallExpressionEvaluator &&
        side.argumentExpressions.every((expr) => isAbsolute(expr))) // TODO needs to be recursive
    );
  });
};

// TODO consider indexing instead of caching to make future lookups immediate
// TODO only run if the instance is immutable

// IF currentContext.contextSize() is big AND currentContext is immutable/secondary
// AND IF one side is relative and one side is constant (isConstantExpression) or absolute or function
// THEN evaluate the constant
// AND use that as a cache key written to a cache on the secondary instance somehow
// AND use the constant in the filter below(?)

export class SecondaryInstanceLookupCache {
  static generateKey = <T extends XPathNode>(
    currentContext: LocationPathEvaluation<T>,
    predicateExpression: ExpressionEvaluator,
    syntaxNode: LocationPathNode
  ): string | undefined => {
    if (currentContext.contextSize() < MINIMUM_NODES_WORTH_CACHING) {
      return;
    }

    if (!(predicateExpression instanceof BinaryExpressionEvaluator)) {
      return;
    }
    const variableSide = getVariableOperand(
      predicateExpression as BinaryExpressionEvaluator<AnyBinaryExprNode>
    );

    if (!variableSide) {
      return;
    }

    const predicateResult = variableSide.evaluate(currentContext).toString();
    const justTheFilter = syntaxNode.text.split(']')[0] + ']';
    return justTheFilter.replace(variableSide.syntaxNode.text, predicateResult);
  };

  static set = (key: string, filteredNodes: XPathNode[]) => {
    cache.set(key, filteredNodes);
  };

  static get = (key: string): XPathNode[] | undefined => {
    return cache.get(key);
  };
}
