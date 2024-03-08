import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { BooleanEvaluation } from '../../evaluations/BooleanEvaluation.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type {
	AndExprNode,
	EqExprNode,
	GtExprNode,
	GteExprNode,
	LtExprNode,
	LteExprNode,
	NeExprNode,
	OrExprNode,
} from '../../static/grammar/SyntaxNode.ts';
import { BinaryExpressionEvaluator } from './BinaryExpressionEvaluator.ts';

type BooleanBinaryExprNode =
	| AndExprNode
	| EqExprNode
	| GteExprNode
	| GtExprNode
	| LteExprNode
	| LtExprNode
	| NeExprNode
	| OrExprNode;

// prettier-ignore
type BooleanOperator<Node extends BooleanBinaryExprNode> =
	Node extends AndExprNode
		? 'and'
	: Node extends EqExprNode
		? 'eq'
	: Node extends GtExprNode
		? 'gt'
	: Node extends GteExprNode
		? 'gte'
	: Node extends LtExprNode
		? 'lt'
	: Node extends LteExprNode
		? 'lte'
	: Node extends NeExprNode
		? 'ne'
	: Node extends OrExprNode
		? 'or'
		: never;

type CompareOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ne';

export class BooleanBinaryExpressionEvaluator<
	Node extends BooleanBinaryExprNode,
> extends BinaryExpressionEvaluator<Node> {
	readonly operator: BooleanOperator<Node>;

	constructor(syntaxNode: Node) {
		super(syntaxNode);

		this.operator = syntaxNode.type.replace('_expr', '') as BooleanOperator<Node>;
	}

	protected and(context: EvaluationContext): Evaluation {
		const { lhs, rhs } = this;
		const lhsResult = lhs.evaluate(context);

		if (lhsResult.toBoolean()) {
			return rhs.evaluate(context);
		}

		return lhsResult;
	}

	protected or(context: EvaluationContext): Evaluation {
		const { lhs, rhs } = this;

		const lhsResult = lhs.evaluate(context);

		if (lhsResult.toBoolean()) {
			return lhsResult;
		}

		return rhs.evaluate(context);
	}

	protected compare(context: EvaluationContext, operator: CompareOperator): BooleanEvaluation {
		const { lhs, rhs } = this;

		const lhsResult = lhs.evaluate(context);
		const rhsResult = rhs.evaluate(context);

		return new BooleanEvaluation(context.currentContext(), lhsResult[operator](rhsResult));
	}

	evaluate(context: EvaluationContext): Evaluation {
		const { operator } = this;

		switch (operator) {
			case 'and':
				return this.and(context);

			case 'or':
				return this.or(context);

			default:
				return this.compare(context, operator);
		}
	}
}
