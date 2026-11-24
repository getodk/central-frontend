import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
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
import { DateTimeLikeEvaluation } from '../../evaluations/DateTimeLikeEvaluation.ts';
import {
  DAY_MILLISECONDS,
  ISO_DATE_OR_DATE_TIME_LIKE_PATTERN,
} from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import type { ValueEvaluation } from '../../evaluations/ValueEvaluation.ts';

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

  evaluate<T extends XPathNode>(context: EvaluationContext<T>): ValueEvaluation<T, 'NUMBER'> {
    const lhsValue = this.lhs.evaluate(context);
    const lhsNumberValue = lhsValue.toNumber();

    if (Number.isNaN(lhsNumberValue)) {
      return new NumberEvaluation(context.currentContext(), NaN);
    }

    const rhsValue = this.rhs.evaluate(context);
    const rhsNumberValue = rhsValue.toNumber();

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

    const lhsMatch = ISO_DATE_OR_DATE_TIME_LIKE_PATTERN.exec(lhsValue.toString());
    const rhsMatch = ISO_DATE_OR_DATE_TIME_LIKE_PATTERN.exec(rhsValue.toString());

    if (lhsMatch != null || rhsMatch != null) {
      return new DateTimeLikeEvaluation(
        context.currentContext(),
        Temporal.Instant.fromEpochMilliseconds(
          Math.round(numberValue * DAY_MILLISECONDS)
        ).toZonedDateTimeISO(Temporal.Now.timeZoneId())
      );
    }

    return new NumberEvaluation(context.currentContext(), numberValue);
  }
}
