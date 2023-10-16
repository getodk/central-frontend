import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { FilterPathExprNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { LocationPathEvaluator } from './LocationPathEvaluator.ts';
import type { LocationPathExpressionEvaluator } from './LocationPathExpressionEvaluator.ts';
import { createExpression } from './factory.ts';

export class FilterPathExpressionEvaluator
	extends LocationPathEvaluator
	implements ExpressionEvaluator
{
	readonly filterExpression: LocationPathExpressionEvaluator;
	readonly hasSteps: boolean;

	constructor(override readonly syntaxNode: FilterPathExprNode) {
		const [filterExprNode, ...rest] = syntaxNode.children;

		super(syntaxNode, {
			isAbsolute: false,
			isFilterExprContext: true,
			isRoot: false,
			isSelf: false,
		});

		this.hasSteps = rest.length > 0;

		const [exprNode] = filterExprNode.children;
		// TODO: possibly an unsafe cast!
		this.filterExpression = createExpression(exprNode) as LocationPathExpressionEvaluator;
	}

	override evaluateNodes(context: EvaluationContext): Iterable<Node> {
		// TODO: this check may not be necessary
		if (this.hasSteps) {
			const filterContextResults = this.filterExpression.evaluate(context);

			if (!(filterContextResults instanceof LocationPathEvaluation)) {
				throw 'todo not a node-set context';
			}

			return super.evaluateNodes(filterContextResults);
		}

		return this.filterExpression.evaluateNodes(context);
	}
}
