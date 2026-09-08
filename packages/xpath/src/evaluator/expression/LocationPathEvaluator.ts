import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type {
  AbsoluteLocationPathNode,
  FilterPathExprNode,
  RelativeLocationPathNode,
} from '../../static/grammar/SyntaxNode.ts';
import type { PathExprSteps } from '../step/Step.ts';
import { pathExprSteps } from '../step/Step.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { LocationPathExpressionEvaluator } from './LocationPathExpressionEvaluator.ts';
import { NumberExpressionEvaluator } from './NumberExpressionEvaluator.ts';
import { createExpression } from './factory.ts';
import { BinaryExpressionEvaluator } from './BinaryExpressionEvaluator.ts';
import { FunctionCallExpressionEvaluator } from './FunctionCallExpressionEvaluator.ts';

type LocationPathNode = AbsoluteLocationPathNode | FilterPathExprNode | RelativeLocationPathNode;

interface LocationPathExpressionOptions {
  readonly isAbsolute: boolean;
  readonly isFilterExprContext: boolean;
  readonly isRoot: boolean;
  readonly isSelf: boolean;
}

const filterCache = new Map<string, XPathNode[]>();

export class LocationPathEvaluator
  extends LocationPathExpressionEvaluator
  implements ExpressionEvaluator
{
  protected isAbsolute: boolean;
  protected isFilterExprContext: boolean;
  protected isRoot: boolean;
  protected isSelf: boolean;

  protected steps: PathExprSteps;

  constructor(
    readonly syntaxNode: LocationPathNode,
    options: LocationPathExpressionOptions
  ) {
    super();

    this.isAbsolute = options.isAbsolute;
    this.isFilterExprContext = options.isFilterExprContext;
    this.isRoot = options.isRoot;
    this.isSelf = options.isSelf;

    this.steps = pathExprSteps(syntaxNode);
  }

  evaluateNodes<T extends XPathNode>(context: EvaluationContext<T>): ReadonlySet<T> {
    if (this.isRoot) {
      return context.rootContext().nodes;
    }

    if (this.isSelf) {
      return context.contextNodes;
    }

    const [contextStep, ...rest] = this.steps;

    let currentContext: LocationPathEvaluation<T>;

    switch (contextStep.axisType) {
      case '__ROOT__':
        currentContext = context.rootContext();
        break;

      case 'self':
        currentContext = context.currentContext();
        break;

      default:
        throw new UnreachableError(contextStep);
    }

    for (const step of rest) {
      currentContext = currentContext.step(step);

      // TODO: predicate *logic* feels like it nicely belongs here (so long as it continues to pertain directly to syntax nodes), but application of predicates is definitely a concern that feels it better belongs in `LocationPathEvaluation`
      for (const predicateNode of step.predicates) {
        const [predicateExpressionNode] = predicateNode.children;
        const predicateExpression = createExpression(predicateExpressionNode);

        let positionPredicate: number | null = null;

        if (predicateExpression instanceof NumberExpressionEvaluator) {
          positionPredicate = predicateExpression.evaluate(currentContext).toNumber();
        }

        const filteredNodes: T[] = [];

        // TODO pull out function that returns filteredNodes
        // TODO consider indexing instead of caching to make future lookups immediate
        // TODO only run if the instance is immutable

        // IF currentContext.contextSize() is big AND currentContext is immutable/secondary
        // AND IF one side is relative and one side is constant (isConstantExpression) or absolute or function
        // THEN evaluate the constant
        // AND use that as a cache key written to a cache on the secondary instance somehow
        // AND use the constant in the filter below(?)
        let cacheKey;
        if (currentContext.contextSize() > 10) {
          // TODO pick a number
          if (predicateExpression instanceof BinaryExpressionEvaluator) {
            let variableSide: ExpressionEvaluator | null;

            if (
              (predicateExpression.rhs instanceof LocationPathEvaluator &&
                predicateExpression.rhs.isAbsolute &&
                predicateExpression.rhs) ||
              (predicateExpression.rhs instanceof FunctionCallExpressionEvaluator &&
                predicateExpression.rhs.argumentExpressions.every(
                  (expr) => expr instanceof LocationPathEvaluator && expr.isAbsolute
                ))
            ) {
              variableSide = predicateExpression.rhs;
            } else if (
              (predicateExpression.lhs instanceof LocationPathEvaluator &&
                predicateExpression.lhs.isAbsolute &&
                predicateExpression.lhs) ||
              (predicateExpression.lhs instanceof FunctionCallExpressionEvaluator &&
                predicateExpression.lhs.argumentExpressions.every(
                  (expr) => expr instanceof LocationPathEvaluator && expr.isAbsolute
                ))
            ) {
              variableSide = predicateExpression.lhs;
            } else {
              variableSide = null;
            }

            if (variableSide) {
              const predicateResult = variableSide.evaluate(currentContext).toString();
              const fullpath = this.syntaxNode.text;
              const justTheFilter = fullpath.split(']')[0] + ']';
              cacheKey = justTheFilter.replace(variableSide.syntaxNode.text, predicateResult);
              if (filterCache.has(cacheKey)) {
                filteredNodes.push(...(filterCache.get(cacheKey)! as T[]));
                currentContext = LocationPathEvaluation.fromArbitraryNodes(
                  currentContext,
                  filteredNodes,
                  this
                );
                continue;
              }
            }
          }
        }

        for (const self of currentContext) {
          if (positionPredicate != null) {
            if (self.contextPosition() === positionPredicate) {
              filteredNodes.push(...self.contextNodes);
              break;
            } else {
              continue;
            }
          }

          const predicateResult = predicateExpression.evaluate(self);

          // TODO: it's surprising there aren't tests exercising this, but it
          // seems pretty likely there would be node cases which should be treated
          // as position predicates? Unclear if numeric strings should as well.
          if (predicateResult.type === 'NUMBER') {
            const evaluatedPositionPredicate = predicateResult.toNumber();

            if (self.contextPosition() === evaluatedPositionPredicate) {
              filteredNodes.push(...self.contextNodes);
            }
          } else if (predicateResult.toBoolean()) {
            filteredNodes.push(...self.contextNodes);
          }
        }

        if (cacheKey) {
          filterCache.set(cacheKey, filteredNodes);
        }

        currentContext = LocationPathEvaluation.fromArbitraryNodes(
          currentContext,
          filteredNodes,
          this
        );
      }
    }

    return currentContext.contextNodes;
  }
}
