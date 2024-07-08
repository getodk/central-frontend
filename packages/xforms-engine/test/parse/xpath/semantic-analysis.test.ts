import { expressionParser } from '@getodk/xpath/expressionParser.js';
import { describe, expect, it } from 'vitest';
import {
	findLocationPathSubExpressionNodes,
	isTranslationExpression,
} from '../../../src/parse/xpath/semantic-analysis.ts';

describe('Semantic analysis', () => {
	describe('FunctionCall', () => {
		describe('translation', () => {
			interface IsTranslationExpressionCase {
				readonly description: string;
				readonly expression: string;
				readonly expected: boolean;
			}

			it.each<IsTranslationExpressionCase>([
				{
					description: 'jr:itext call referencing string Literal id',
					expression: 'jr:itext("id")',
					expected: true,
				},
				{
					description: 'jr:itext call referencing RelativeLocationPath id',
					expression: 'jr:itext(itemset-item-label-reference)',
					expected: true,
				},
				{
					description: 'jr:itext call referencing AbsoluteLocationPath id',
					expression: 'jr:itext(/some/absolute/reference)',
					expected: true,
				},
				{
					description: 'unexpected Number argument',
					expression: 'jr:itext(1)',
					expected: false,
				},
				{
					description: 'FuntionName references another function',
					expression: 'some-other-fn()',
					expected: false,
				},
				{
					description: 'itext is substring of FunctionName, not full name',
					expression: 'some-fn-with-itext-in-name()',
					expected: false,
				},

				{
					description:
						'we do not currently check prefixes for function call analysis, typical usage has common namespace mapping',
					expression: 'other-prefix:itext("id")',
					expected: true,
				},
			])(
				'determines that an expression is a translation - $expression = $expected ($description)',
				({ expression, expected }) => {
					expect(isTranslationExpression(expression)).toBe(expected);
				}
			);
		});
	});

	describe('LocationPath', () => {
		interface FindLocationPathSubExpressionsCase {
			readonly expression: string;
			readonly expected: readonly string[];
		}

		it.each<FindLocationPathSubExpressionsCase>([
			{
				expression: '/foo',
				expected: ['/foo'],
			},
			{
				expression: '/foo[bar = "quux"]',
				expected: ['/foo[bar = "quux"]'],
			},
			{
				expression: '(foo | /bar) or if(false(), ./bat, //quux)',
				expected: ['foo', '/bar', './bat', '//quux'],
			},
		])('finds $expected sub-expressions in expression $expression', ({ expression, expected }) => {
			const { rootNode } = expressionParser.parse(expression);
			const nodes = findLocationPathSubExpressionNodes(rootNode);
			const actual = nodes.map((node) => node.text);

			expect(actual).toEqual(expected);
		});
	});
});
