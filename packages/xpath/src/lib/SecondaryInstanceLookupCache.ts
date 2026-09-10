import type { XPathNode } from '../adapter/interface/XPathNode';
import type { LocationPathEvaluation } from '../evaluations/LocationPathEvaluation';
import { BinaryExpressionEvaluator } from '../evaluator/expression/BinaryExpressionEvaluator';
import type { ExpressionEvaluator } from '../evaluator/expression/ExpressionEvaluator';
import { createExpression } from '../evaluator/expression/factory';
import { FunctionCallExpressionEvaluator } from '../evaluator/expression/FunctionCallExpressionEvaluator';
import {
  LocationPathEvaluator,
  type LocationPathNode,
} from '../evaluator/expression/LocationPathEvaluator';
import type { AnyBinaryExprNode, PredicateNode } from '../static/grammar/SyntaxNode';

const MINIMUM_NODES_WORTH_CACHING = 10; // TODO consider changing number

const cache = new Map<string, XPathNode[]>(); // TODO cache invalidation - probably not necessary until we refresh secondary instances

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

const getVariableOperand = (expr: ExpressionEvaluator) => {
  if (!(expr instanceof BinaryExpressionEvaluator)) {
    return;
  }
  if ((expr as BinaryExpressionEvaluator<AnyBinaryExprNode>).syntaxNode.type !== 'eq_expr') {
    return;
  }
  return [expr.lhs, expr.rhs].find(isAbsoluteOrConstant);
};

// TODO consider indexing instead of caching to make future lookups immediate

export class SecondaryInstanceLookupCache {
  static generateKey = <T extends XPathNode>(
    currentContext: LocationPathEvaluation<T>,
    nodes: readonly PredicateNode[],
    syntaxNode: LocationPathNode
  ): string | undefined => {
    if (currentContext.contextSize() < MINIMUM_NODES_WORTH_CACHING) {
      return;
    }

    let result = syntaxNode.text;
    let lastFoundIndex = 0;

    for (const node of nodes) {
      const [predicateExpressionNode] = node.children;
      const predicateExpression = createExpression(predicateExpressionNode);

      const variableSide = getVariableOperand(predicateExpression);
      if (!variableSide) {
        continue;
      }

      const predicateResult = variableSide.evaluate(currentContext).toString();
      lastFoundIndex = result.indexOf(variableSide.syntaxNode.text) + predicateResult.length + 1;
      result = result.replace(variableSide.syntaxNode.text, predicateResult);
    }

    if (lastFoundIndex === 0) {
      // no predicates found
      return;
    }

    return result.substring(0, lastFoundIndex);
  };

  static set = (key: string, filteredNodes: XPathNode[]) => {
    cache.set(key, filteredNodes);
  };

  static get = (key: string): XPathNode[] | undefined => {
    return cache.get(key);
  };

  // exposed for testing
  static getCache = (): Map<string, XPathNode[]> => {
    return cache;
  };
}
