import { expressionParser } from '@getodk/xpath/expressionParser.js';
import type {
	AndExprNode,
	FunctionNameNode,
	OrExprNode,
	PrefixedNameNode,
	UnprefixedNameNode,
} from '@getodk/xpath/static/grammar/SyntaxNode.js';
import type { AnySyntaxType } from '@getodk/xpath/static/grammar/type-names.js';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { TypedSyntaxNode } from '../../../src/parse/xpath/syntax-traversal.ts';
import {
	collectTypedNodes,
	findTypedPrincipalExpressionNode,
} from '../../../src/parse/xpath/syntax-traversal.ts';

interface BaseExpectedSyntaxNode {
	readonly type?: AnySyntaxType;
	readonly text?: string;
}

interface ExpectedTypedSyntaxNode extends BaseExpectedSyntaxNode {
	readonly type: AnySyntaxType;
}

interface ExpectedTextSyntaxNode extends BaseExpectedSyntaxNode {
	readonly text: string;
}

type ExpectedSyntaxNode = ExpectedTextSyntaxNode | ExpectedTypedSyntaxNode;

describe('XPath syntax traversal', () => {
	describe('collecting SyntaxNodes by type', () => {
		interface CollectTypedNodesCase {
			readonly expressionDescription: string;
			readonly expression: string;
			readonly types: readonly [AnySyntaxType, ...AnySyntaxType[]];
			readonly deep?: true;
			readonly resultsDescription: string;
			readonly expected: readonly ExpectedSyntaxNode[];
		}

		const cases: readonly CollectTypedNodesCase[] = [
			{
				expressionDescription: 'number',
				expression: '1.59',
				types: ['number'],
				resultsDescription: 'Number',
				expected: [{ type: 'number', text: '1.59' }],
			},
			{
				expressionDescription: 'union',
				expression: 'foo | /bar',
				types: ['absolute_location_path', 'relative_location_path'],
				resultsDescription: 'LocationPath',
				expected: [
					{ type: 'relative_location_path', text: 'foo' },
					{ type: 'absolute_location_path', text: '/bar' },
				],
			},
			{
				expressionDescription: 'predicated path',
				expression: 'foo[bar = ./quux]',
				types: ['absolute_location_path', 'relative_location_path'],
				resultsDescription: 'outermost LocationPath',
				expected: [{ type: 'relative_location_path', text: 'foo[bar = ./quux]' }],
			},
			{
				expressionDescription: 'predicated path',
				expression: 'foo[bar = ./quux]',
				types: ['absolute_location_path', 'relative_location_path'],
				resultsDescription: 'outermost and nested LocationPath',
				deep: true,
				expected: [
					{ type: 'relative_location_path', text: 'foo[bar = ./quux]' },
					{ type: 'relative_location_path', text: 'bar' },
					{ type: 'relative_location_path', text: './quux' },
				],
			},
		];

		it.each<CollectTypedNodesCase>(cases)(
			'finds $resultsDescription nodes in $expressionDescription expressions',
			({ expression, types, deep, expected }) => {
				const { rootNode } = expressionParser.parse(expression);
				const nodes = collectTypedNodes(types, rootNode, {
					recurseMatchedNodes: deep ?? false,
				});
				for (const [index, expectedNode] of expected.entries()) {
					const resultNode = nodes[index];

					expect(resultNode).toMatchObject(expectedNode);
				}
			}
		);

		it('narrows the types of collected nodes based on the queried types', () => {
			const { rootNode } = expressionParser.parse('type-only-test');

			expectTypeOf(collectTypedNodes(['and_expr', 'or_expr'], rootNode)).toEqualTypeOf<
				ReadonlyArray<AndExprNode | OrExprNode>
			>([]);

			expectTypeOf(
				collectTypedNodes(['function_name', 'prefixed_name', 'unprefixed_name'], rootNode)
			).toEqualTypeOf<ReadonlyArray<FunctionNameNode | PrefixedNameNode | UnprefixedNameNode>>([]);

			expectTypeOf(
				collectTypedNodes(
					[
						// @ts-expect-error - Not a real syntax type!
						'nonexistent_type',
					],
					rootNode
				)
			).not.toEqualTypeOf<
				ReadonlyArray<
					// @ts-expect-error - Not a real syntax type!
					TypedSyntaxNode<'nonexistent_type'>
				>
			>([]);
		});
	});

	describe('finding a full-expression SyntaxNode by type', () => {
		interface FindTypedPrincipalExpressionNodeCase {
			readonly expressionDescription: string;
			readonly expression: string;
			readonly types: readonly [AnySyntaxType, ...AnySyntaxType[]];
			readonly resultDescription: string;
			readonly expected: ExpectedSyntaxNode | null;
		}

		const cases: readonly FindTypedPrincipalExpressionNodeCase[] = [
			{
				expressionDescription: 'FunctionCall',
				expression: 'jr:itext("foo")',
				types: ['function_call'],
				resultDescription: 'FunctionCall',
				expected: { type: 'function_call', text: 'jr:itext("foo")' },
			},
			{
				expressionDescription: 'Step, with FunctionCall in Predicate',
				expression: 'foo[position() = 2]',
				types: ['function_call'],
				resultDescription: 'null (position call is sub-expression)',
				expected: null,
			},
			{
				expressionDescription: 'AbsoluteLocationPath',
				expression: '/foo',
				types: ['absolute_location_path', 'relative_location_path'],
				resultDescription: 'AbsoluteLocationPath',
				expected: {
					type: 'absolute_location_path',
					text: '/foo',
				},
			},
			{
				expressionDescription: 'RelativeLocationPath, with AbsoluteLocationPath in Predicate',
				expression: 'bar/bat[position() = /quux]',
				types: ['absolute_location_path', 'relative_location_path'],
				resultDescription: 'RelativeLocationPath',
				expected: {
					type: 'relative_location_path',
					text: 'bar/bat[position() = /quux]',
				},
			},
			{
				expressionDescription: 'UnionExpr',
				expression: '/foo | bar',
				types: ['absolute_location_path', 'relative_location_path'],
				resultDescription: 'null (both queried types are sub-expressions)',
				expected: null,
			},
		];

		it.each<FindTypedPrincipalExpressionNodeCase>(cases)(
			'finds $resultDescription in an $expressionDescription expression',
			({ expression, types, expected }) => {
				const { rootNode } = expressionParser.parse(expression);
				const result = findTypedPrincipalExpressionNode(types, rootNode);

				if (expected == null) {
					expect(result).toBeNull();
				} else {
					expect(result).toMatchObject(expected);
				}
			}
		);

		it('narrows the type of the result node based on queried types', () => {
			const { rootNode } = expressionParser.parse('type-only-test');

			expectTypeOf(
				findTypedPrincipalExpressionNode(['and_expr', 'or_expr'], rootNode)
			).toEqualTypeOf<AndExprNode | OrExprNode | null>(null);

			expectTypeOf(
				findTypedPrincipalExpressionNode(
					['function_name', 'prefixed_name', 'unprefixed_name'],
					rootNode
				)
			).toEqualTypeOf<FunctionNameNode | PrefixedNameNode | UnprefixedNameNode | null>(null);

			expectTypeOf(
				findTypedPrincipalExpressionNode(
					[
						// @ts-expect-error - Not a real syntax type!
						'nonexistent_type',
					],
					rootNode
				)
			).not.toEqualTypeOf<// @ts-expect-error - Not a real syntax type!
			// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- (`never | null`)
			TypedSyntaxNode<'nonexistent_type'> | null>(null);
		});
	});
});
