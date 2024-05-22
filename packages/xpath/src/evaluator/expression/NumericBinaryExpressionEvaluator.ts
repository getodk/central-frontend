import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import type {
	AdditionExprNode,
	DivisionExprNode,
	ModuloExprNode,
	MultiplicationExprNode,
	SubtractionExprNode,
} from '../../static/grammar/SyntaxNode.ts';
import { BinaryExpressionEvaluator } from './BinaryExpressionEvaluator.ts';

type NumericBinaryExprNode =
	| AdditionExprNode
	| DivisionExprNode
	| ModuloExprNode
	| MultiplicationExprNode
	| SubtractionExprNode;

// prettier-ignore
type NumericOperation<Node extends NumericBinaryExprNode> =
	Node extends AdditionExprNode
		? 'addition'
	: Node extends DivisionExprNode
		? 'division'
	: Node extends ModuloExprNode
		? 'modulo'
	: Node extends MultiplicationExprNode
		? 'multiplication'
	: Node extends SubtractionExprNode
		? 'subtraction'
		: never;

export class NumericBinaryExpressionEvaluator<
	Node extends NumericBinaryExprNode,
> extends BinaryExpressionEvaluator<Node> {
	readonly operation: NumericOperation<Node>;

	constructor(node: Node) {
		super(node);

		this.operation = node.type.replace('_expr', '') as NumericOperation<Node>;
	}

	evaluate(context: EvaluationContext): NumberEvaluation {
		const lhsNumberValue = this.lhs.evaluate(context).toNumber();

		if (Number.isNaN(lhsNumberValue)) {
			return new NumberEvaluation(context.currentContext(), NaN);
		}

		const rhsNumberValue = this.rhs.evaluate(context).toNumber();

		if (Number.isNaN(rhsNumberValue)) {
			return new NumberEvaluation(context.currentContext(), NaN);
		}

		const { operation } = this;

		let numberValue: number;

		switch (operation) {
			case 'addition':
				numberValue = lhsNumberValue + rhsNumberValue;
				break;

			case 'division':
				numberValue = lhsNumberValue / rhsNumberValue;
				break;

			case 'modulo':
				numberValue = lhsNumberValue % rhsNumberValue;
				break;

			case 'multiplication':
				numberValue = lhsNumberValue * rhsNumberValue;
				break;

			case 'subtraction':
				numberValue = lhsNumberValue - rhsNumberValue;
				break;

			default:
				throw new UnreachableError(operation);
		}

		return new NumberEvaluation(context.currentContext(), numberValue);
	}
}
