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
import type { AnyBinaryExprNode, EqExprNode, PredicateNode } from '../static/grammar/SyntaxNode';

const MINIMUM_NODES_WORTH_CACHING = 10; // TODO consider changing number

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

const getConstantOperand = (expr: ExpressionEvaluator) => {
  return isEqualsExpression(expr) && [expr.lhs, expr.rhs].find(isAbsoluteOrConstant);
};

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

      const constantOperand = getConstantOperand(predicateExpression);
      if (!constantOperand) {
        continue;
      }

      const predicateResult = constantOperand.evaluate(currentContext).toString();

      // this needs unit testing

      const endOfOperand = result.indexOf(constantOperand.syntaxNode.text) + constantOperand.syntaxNode.text.length;
      lastFoundIndex = result.indexOf(']', endOfOperand) + 1 - constantOperand.syntaxNode.text.length +  predicateResult.length;
      result = result.replace(constantOperand.syntaxNode.text, predicateResult);
    }

    if (lastFoundIndex === 0) {
      // no predicates found
      return;
    }

    return result.substring(0, lastFoundIndex);
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
