import type { XPathNode } from '../adapter/interface/XPathNode';
import type { LocationPathEvaluation } from '../evaluations/LocationPathEvaluation';
import { BinaryExpressionEvaluator } from '../evaluator/expression/BinaryExpressionEvaluator';
import type { ExpressionEvaluator } from '../evaluator/expression/ExpressionEvaluator';
import { FunctionCallExpressionEvaluator } from '../evaluator/expression/FunctionCallExpressionEvaluator';
import {
  LocationPathEvaluator,
  type LocationPathNode,
} from '../evaluator/expression/LocationPathEvaluator';
import type { AnyBinaryExprNode, EqExprNode } from '../static/grammar/SyntaxNode';

const MINIMUM_NODES_WORTH_CACHING = 10;

const cache = new Map<string, ReadonlySet<XPathNode>>();

const isAbsoluteOrConstant = (expr: ExpressionEvaluator) => {
  if (expr instanceof LocationPathEvaluator && expr.isAbsolute) {
    return true;
  }
  const nodeType = expr.syntaxNode?.type;
  if (nodeType === 'number' || nodeType === 'string_literal') {
    return true;
  }
  if (expr instanceof FunctionCallExpressionEvaluator) {
    return expr.argumentExpressions.every(isAbsoluteOrConstant);
  }
  return false;
};

const isEqualsExpression = (
  expr: ExpressionEvaluator
): expr is BinaryExpressionEvaluator<EqExprNode> => {
  return (
    expr instanceof BinaryExpressionEvaluator &&
    (expr as BinaryExpressionEvaluator<AnyBinaryExprNode>).syntaxNode.type === 'eq_expr'
  );
};

const getIndexKey = (expr: ExpressionEvaluator) => {
  return isEqualsExpression(expr) && [expr.lhs, expr.rhs].find(isAbsoluteOrConstant);
};

export class SecondaryInstanceLookupCache {
  static generateKey = <T extends XPathNode>(
    currentContext: LocationPathEvaluation<T>,
    predicateExpressions: readonly ExpressionEvaluator[],
    syntaxNode: LocationPathNode
  ): string | undefined => {
    if (currentContext.contextSize() < MINIMUM_NODES_WORTH_CACHING) {
      return;
    }

    const replacements = [];

    for (const predicateExpression of predicateExpressions) {
      const indexKey = getIndexKey(predicateExpression);
      if (!indexKey) {
        // can't cache when any of the predicates can't be reliably cached
        return;
      }

      const result = indexKey.evaluate(currentContext).toString();
      const expr = indexKey.syntaxNode.text;
      replacements.push({ expr, result });
    }

    if (replacements.length === 0) {
      // no predicates found
      return;
    }

    const lastExpression = replacements[replacements.length - 1]!.expr;
    const endOfLastReplacement = syntaxNode.text.indexOf(lastExpression) + lastExpression.length;
    const endOfPredicate = syntaxNode.text.indexOf(']', endOfLastReplacement) + 1;
    let key = syntaxNode.text.substring(0, endOfPredicate);
    for (const { expr, result } of replacements) {
      key = key.replace(expr, result);
    }
    return key;
  };

  static set<T extends XPathNode>(key: string, filteredNodes: ReadonlySet<T>) {
    cache.set(key, filteredNodes);
  }

  static get<T extends XPathNode>(key: string): ReadonlySet<T> | undefined {
    return cache.get(key) as ReadonlySet<T> | undefined;
  }

  static size(): number {
    return cache.size;
  }

  static clear(): void {
    cache.clear();
  }
}
