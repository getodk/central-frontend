import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { ContextNode } from '../../lib/dom/types.ts';
import type {
	AbsoluteLocationPathNode,
	FilterPathExprNode,
	RelativeLocationPathNode,
} from '../../static/grammar/SyntaxNode.ts';
import { pathExprSteps, type PathExprSteps } from '../step/Step.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { LocationPathExpressionEvaluator } from './LocationPathExpressionEvaluator.ts';
import { NumberExpressionEvaluator } from './NumberExpressionEvaluator.ts';
import { createExpression } from './factory.ts';

type LocationPathNode = AbsoluteLocationPathNode | FilterPathExprNode | RelativeLocationPathNode;

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

	evaluateNodes(context: EvaluationContext): Iterable<Node> {
		if (this.isRoot) {
			return context.rootContext().nodes;
		}

		if (this.isSelf) {
			return context.contextNodes;
		}

		const [contextStep, ...rest] = this.steps;

		let currentContext: LocationPathEvaluation;

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

				const filteredNodes: Node[] = [];

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
					(filteredNodes as ContextNode[]).values(),
					this
				);
			}
		}

		return currentContext.contextNodes;
	}
}
