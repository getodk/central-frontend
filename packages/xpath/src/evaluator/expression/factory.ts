import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type {
	AnyExprNode,
	ArgumentNode,
	ExprNode,
	XPathNode,
} from '../../static/grammar/SyntaxNode.ts';
import { AbsoluteLocationPathExpressionEvaluator } from './AbsoluteLocationPathExpressionEvaluator.ts';
import { BooleanBinaryExpressionEvaluator } from './BooleanBinaryExpressionEvaluator.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { FilterPathExpressionEvaluator } from './FilterPathExpressionEvaluator.ts';
import { FunctionCallExpressionEvaluator } from './FunctionCallExpressionEvaluator.ts';
import { NumberLiteralExpressionEvaluator } from './NumberLiteralExpressionEvaluator.ts';
import { NumericBinaryExpressionEvaluator } from './NumericBinaryExpressionEvaluator.ts';
import { RelativeLocationPathExpressionEvaluator } from './RelativeLocationPathExpressionEvaluator.ts';
import { StringLiteralExpressionEvaluator } from './StringLiteralExpressionEvaluator.ts';
import { UnaryExpressionEvaluator } from './UnaryExpressionEvaluator.ts';
import { UnionExpressionEvaluator } from './UnionExpressionEvaluator.ts';

type EvaluableExprNode = AnyExprNode | ArgumentNode | ExprNode | XPathNode;

export const createExpression = (syntaxNode: EvaluableExprNode): ExpressionEvaluator => {
	switch (syntaxNode.type) {
		case 'xpath':
		case 'argument': {
			const [evaluableNode] = syntaxNode.children[0].children;

			return createExpression(evaluableNode);
		}

		case 'expr': {
			const [evaluableNode] = syntaxNode.children;

			return createExpression(evaluableNode);
		}

		case 'and_expr':
		case 'eq_expr':
		case 'gt_expr':
		case 'gte_expr':
		case 'lt_expr':
		case 'lte_expr':
		case 'ne_expr':
		case 'or_expr': {
			return new BooleanBinaryExpressionEvaluator(syntaxNode);
		}

		case 'addition_expr':
		case 'division_expr':
		case 'subtraction_expr':
		case 'modulo_expr':
		case 'multiplication_expr': {
			return new NumericBinaryExpressionEvaluator(syntaxNode);
		}

		case 'union_expr': {
			return new UnionExpressionEvaluator(syntaxNode);
		}

		case 'unary_expr': {
			return new UnaryExpressionEvaluator(syntaxNode);
		}

		case 'function_call': {
			return new FunctionCallExpressionEvaluator(syntaxNode);
		}

		case 'absolute_location_path':
			return new AbsoluteLocationPathExpressionEvaluator(syntaxNode);

		case 'filter_path_expr':
			if (syntaxNode.children.length === 1) {
				const [exprNode] = syntaxNode.children[0].children;

				return createExpression(exprNode);
			}

			return new FilterPathExpressionEvaluator(syntaxNode);

		case 'relative_location_path':
			return new RelativeLocationPathExpressionEvaluator(syntaxNode);

		case 'number': {
			return new NumberLiteralExpressionEvaluator(syntaxNode);
		}

		case 'string_literal':
			return new StringLiteralExpressionEvaluator(syntaxNode);

		default:
			throw new UnreachableError(syntaxNode);
	}
};
