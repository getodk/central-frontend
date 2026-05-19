import { expressionParser } from '@getodk/xpath/expressionParser.js';
import { describe, expect, it } from 'vitest';
import {
	findLocationPathSubExpressionNodes,
	isConstantExpression,
	isConstantTruthyExpression,
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
					description: 'Number argument; this counts because it will be cast to string',
					expression: 'jr:itext(1)',
					expected: true,
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

				// From question 6 in https://github.com/getodk/web-forms/pull/166#issuecomment-2243849828
				//
				// The intent of this question is currently addressed in a `@todo`
				// added to the `isTranslationExpression` JSDoc, in this same commit.
				{
					description:
						'as the name is meant to suggest, `isTranslationExpression` is a check for whether the complete expression is a translation expression; this is important to distinguish such expressions from arbitrary text in `jr:constraintMsg`/`jr:requiredMsg`',
					expression: '/foo[jr:itext("id") = 1]',
					expected: false,
				},

				{
					description: 'argument is a string',
					expression: 'jr:itext(string(1))',
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
			{
				expression: 'foo("bar", /bat)/quux',
				expected: ['foo("bar", /bat)/quux', '/bat'],
			},
		])('finds $expected sub-expressions in expression $expression', ({ expression, expected }) => {
			const { rootNode } = expressionParser.parse(expression);
			const nodes = findLocationPathSubExpressionNodes(rootNode);
			const actual = nodes.map((node) => node.text);

			expect(actual).toEqual(expected);
		});
	});

	interface ExpressionPredicateCase {
		readonly expression: string;
		readonly expected: boolean;
	}

	describe('Constant expressions', () => {
		it.each<ExpressionPredicateCase>([
			{ expression: 'true()', expected: true },
			{ expression: ' true( \t\n)\n', expected: true },
			{ expression: 'false()', expected: true },
			{ expression: '1', expected: true },
			{ expression: '0', expected: true },
			{ expression: '"."', expected: true },
			{ expression: '""', expected: true },
			{ expression: "'!'", expected: true },
			{ expression: "''", expected: true },
			{ expression: '/', expected: false },
			{ expression: 'jr:itext("foo")', expected: false },
		])(
			'identifies whether $expression will always produce the same result value: $expected',
			({ expression, expected }) => {
				expect(isConstantExpression(expression)).toBe(expected);
			}
		);
	});

	describe('Constant, truthy expressions', () => {
		it.each<ExpressionPredicateCase>([
			{ expression: 'true()', expected: true },
			{ expression: ' true( \t\n)\n', expected: true },
			{ expression: 'false()', expected: false },
			{ expression: '1', expected: true },
			{ expression: '0', expected: false },
			{ expression: '"."', expected: true },
			{ expression: '""', expected: false },
			{ expression: "'!'", expected: true },
			{ expression: "''", expected: false },
		])(
			'identifies whether $expression will always return true: $expected',
			({ expression, expected }) => {
				expect(isConstantTruthyExpression(expression)).toBe(expected);
			}
		);
	});
});
