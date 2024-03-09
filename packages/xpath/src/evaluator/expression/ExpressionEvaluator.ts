import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type {
	AbsoluteLocationPathNode,
	AnyExprNode,
	FilterPathExprNode,
	RelativeLocationPathNode,
} from '../../static/grammar/SyntaxNode.ts';

export type ExpressionNode =
	| AbsoluteLocationPathNode
	| AnyExprNode
	| FilterPathExprNode
	| RelativeLocationPathNode;

export interface ExpressionEvaluator {
	readonly syntaxNode: ExpressionNode;

	evaluate(context: EvaluationContext): Evaluation;
}
