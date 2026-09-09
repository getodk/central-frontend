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
import { SecondaryInstanceLookupCache } from '../../lib/SecondaryInstanceLookupCache.ts';

export type LocationPathNode =
  | AbsoluteLocationPathNode
  | FilterPathExprNode
  | RelativeLocationPathNode;

interface LocationPathExpressionOptions {
  readonly isAbsolute: boolean;
  readonly isFilterExprContext: boolean;
  readonly isRoot: boolean;
  readonly isSelf: boolean;
}

export class LocationPathEvaluator
  extends LocationPathExpressionEvaluator
  implements ExpressionEvaluator
{
  readonly isAbsolute: boolean;
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

      if (step.nodeName === 'instance') {
        // const pos = context.rootContext().evaluator.evaluateString('/root/instance');
        const [n] = currentContext.nodes;
        if (n) {
          console.log({abc: currentContext.domProvider.getPreviousSiblingElement(n)});
          const parent = currentContext.domProvider.getParentNode(n);
          if (parent) {
            const first = currentContext.domProvider.getFirstChildNode(parent);
            console.log({xyz: currentContext.domProvider.compareDocumentOrder(first!, n)});

          }

        }


        // detect if first child somehow
      }

      currentContext = currentContext.step(step);


      const cacheKey = SecondaryInstanceLookupCache.generateKey(
        currentContext,
        step.predicates,
        this.syntaxNode
      );

      if (cacheKey) {
        const nodes = SecondaryInstanceLookupCache.get(cacheKey);
        if (nodes) {
          currentContext = LocationPathEvaluation.fromArbitraryNodes(
            currentContext,
            nodes as T[],
            this
          );
          continue;
        }
      }

      // TODO: predicate *logic* feels like it nicely belongs here (so long as it continues to pertain directly to syntax nodes), but application of predicates is definitely a concern that feels it better belongs in `LocationPathEvaluation`
      for (const predicateNode of step.predicates) {

        const [predicateExpressionNode] = predicateNode.children;
        const predicateExpression = createExpression(predicateExpressionNode);

        let positionPredicate: number | null = null;

        if (predicateExpression instanceof NumberExpressionEvaluator) {
          positionPredicate = predicateExpression.evaluate(currentContext).toNumber();
        }

        const filteredNodes: T[] = [];

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

        
        currentContext = LocationPathEvaluation.fromArbitraryNodes(
          currentContext,
          filteredNodes,
          this
        );
      }
      if (cacheKey) {
        SecondaryInstanceLookupCache.set(cacheKey, Array.from(currentContext.contextNodes)); // TODO maybe keep the set?
      }
    }

    return currentContext.contextNodes;
  }
}
