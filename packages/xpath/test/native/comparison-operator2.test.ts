import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('Comparison operator (2)', () => {
	let testContext: TestContext;
	let document: XMLDocument;

	beforeEach(() => {
		testContext = createTestContext(`
      <div id="ComparisonOperatorCase">
        <div id="ComparisonOperatorCaseNodesetNegative5to5">
          <div>-5</div>
          <div>-4</div>
          <div>-3</div>
          <div>-2</div>
          <div>-1</div>
          <div>0</div>
          <div>1</div>
          <div>2</div>
          <div>3</div>
          <div>4</div>
          <div>5</div>
        </div>

        <div id="ComparisonOperatorCaseNodeset6to10">
          <div>6</div>
          <div>7</div>
          <div>8</div>
          <div>9</div>
          <div>10</div>
        </div>

        <div id="ComparisonOperatorCaseNodeset4to8">
          <div>4</div>
          <div>5</div>
          <div>6</div>
          <div>7</div>
          <div>8</div>
        </div>

        <div id="ComparisonOperatorCaseNodesetEmpty">
        </div>

        <div id="ComparisonOperatorCaseNodesetStrings">
          <div>aaa</div>
          <div>bbb</div>
          <div>cccccc</div>
          <div>ddd</div>
          <div>eee</div>
        </div>
      </div>
    `);
		document = testContext.document;
	});

	interface TestCaseInput {
		// Note: these are not labeled lhs/rhs because the tests check for the
		// commutative property.
		readonly operands: readonly [op0: string, op1: string];
		// TODO: given that the operators are = and !=, how the heck is it ever the case
		// that both expected values are the same? Maybe some weirdness with NaN???
		readonly expected: readonly [exp0: boolean, exp1: boolean];
		readonly id?: string;
	}

	const input: readonly TestCaseInput[] = [
		{ operands: ['1', '1'], expected: [true, false] },
		{ operands: ['1', '0'], expected: [false, true] },
		{ operands: ['1', "'1'"], expected: [true, false] },
		{ operands: ['1', "'0'"], expected: [false, true] },
		{ operands: ['1', 'true()'], expected: [true, false] },
		{ operands: ['1', 'false()'], expected: [false, true] },
		{ operands: ['0', 'false()'], expected: [true, false] },
		{
			operands: ['-10', '*'],
			id: 'ComparisonOperatorCaseNodesetNegative5to5',
			expected: [false, true],
		},
		{
			operands: ['4', '*'],
			id: 'ComparisonOperatorCaseNodesetNegative5to5',
			expected: [true, true],
		},
		{
			operands: ['4.3', '*'],
			id: 'ComparisonOperatorCaseNodesetNegative5to5',
			expected: [false, true],
		},
		{ operands: ['0', '*'], id: 'ComparisonOperatorCaseNodesetEmpty', expected: [false, false] },
		{ operands: ['true()', 'true()'], expected: [true, false] },
		{ operands: ['false()', 'false()'], expected: [true, false] },
		{ operands: ['true()', 'false()'], expected: [false, true] },
		{ operands: ['true()', "'1'"], expected: [true, false] },
		{ operands: ['true()', "''"], expected: [false, true] },
		{ operands: ['false()', "'0'"], expected: [false, true] },
		{ operands: ['false()', "''"], expected: [true, false] },
		{
			operands: ['true()', '*'],
			id: 'ComparisonOperatorCaseNodesetNegative5to5',
			expected: [true, false],
		},
		{
			operands: ['false()', '*'],
			id: 'ComparisonOperatorCaseNodesetNegative5to5',
			expected: [false, true],
		},
		{
			operands: ['true()', '*'],
			id: 'ComparisonOperatorCaseNodesetEmpty',
			expected: [false, true],
		},
		{
			operands: ['false()', '*'],
			id: 'ComparisonOperatorCaseNodesetEmpty',
			expected: [true, false],
		},
		{ operands: ["'1a'", "'1a'"], expected: [true, false] },
		{ operands: ["'1'", "'0'"], expected: [false, true] },
		{ operands: ["''", "''"], expected: [true, false] },
		{ operands: ["''", "'0'"], expected: [false, true] },
		{
			operands: ["'aaa'", '*'],
			id: 'ComparisonOperatorCaseNodesetStrings',
			expected: [true, true],
		},
		{
			operands: ["'bb'", '*'],
			id: 'ComparisonOperatorCaseNodesetStrings',
			expected: [false, true],
		},
		{ operands: ["''", '*'], id: 'ComparisonOperatorCaseNodesetStrings', expected: [false, true] },
		{ operands: ["''", '*'], id: 'ComparisonOperatorCaseNodesetEmpty', expected: [false, false] },
		// [[ "id('ComparisonOperatorCaseNodesetNegative5to5')/*", "id('ComparisonOperatorCaseNodesetEmpty')/*" ], [ false, false ]],
		// [[ "id('ComparisonOperatorCaseNodesetNegative5to5')/*", "id('ComparisonOperatorCaseNodeset4to8')/*" ], [ true, true ]],
		// [[ "id('ComparisonOperatorCaseNodesetNegative5to5')/*", "id('ComparisonOperatorCaseNodeset6to10')/*" ], [ false, true ], doc]
	];

	input.forEach(({ operands, id, expected }) => {
		const [operand0, operand1] = operands;

		['=', '!='].forEach((operator, index) => {
			const expressions = [
				`${operand0} ${operator} ${operand1}`,
				`${operand1} ${operator} ${operand0}`,
			];
			const expectedValue = expected[index as 0 | 1];

			expressions.forEach((expression) => {
				const contextSuffix = id == null ? '' : ` (with context #${id})`;

				it(`evaluates ${expression} to ${expectedValue}${contextSuffix}`, () => {
					const contextNode = id == null ? document : document.getElementById(id)!;

					testContext.assertBooleanValue(expression, expectedValue, {
						contextNode,
					});
				});
			});
		});
	});

	describe('<, <=, >, >=', () => {
		interface RelationalExprTestCaseInput {
			readonly operands: readonly [lhs: string, rhs: string];
			readonly expected: readonly [lt: boolean, lte: boolean, gt: boolean, gte: boolean];
		}

		const cases: readonly RelationalExprTestCaseInput[] = [
			{ operands: ['1', '2'], expected: [true, true, false, false] },
			{ operands: ['1', '1'], expected: [false, true, false, true] },
			{ operands: ['1', '0'], expected: [false, false, true, true] },
			{ operands: ['1', "'2'"], expected: [true, true, false, false] },
			{ operands: ['1', "'1'"], expected: [false, true, false, true] },
			{ operands: ['1', "'0'"], expected: [false, false, true, true] },
			{ operands: ['2', 'true()'], expected: [false, false, true, true] },
			{ operands: ['1', 'true()'], expected: [false, true, false, true] },
			{ operands: ['1', 'false()'], expected: [false, false, true, true] },
			{ operands: ['0', 'false()'], expected: [false, true, false, true] },
			{ operands: ['0', 'true()'], expected: [true, true, false, false] },
			{ operands: ['true()', '2'], expected: [true, true, false, false] },
			{ operands: ['true()', '1'], expected: [false, true, false, true] },
			{ operands: ['false()', '1'], expected: [true, true, false, false] },
			{ operands: ['false()', '0'], expected: [false, true, false, true] },
			{ operands: ['true()', '0'], expected: [false, false, true, true] },
			{ operands: ['true()', 'true()'], expected: [false, true, false, true] },
			{ operands: ['true()', 'false()'], expected: [false, false, true, true] },
			{ operands: ['false()', 'false()'], expected: [false, true, false, true] },
			{ operands: ['false()', 'true()'], expected: [true, true, false, false] },
			{ operands: ['true()', "'1'"], expected: [false, true, false, true] },
			{ operands: ['true()', "''"], expected: [false, false, false, false] },
			{ operands: ['false()', "'0'"], expected: [false, true, false, true] },
			{ operands: ['false()', "''"], expected: [false, false, false, false] },
			{ operands: ["'2'", '1'], expected: [false, false, true, true] },
			{ operands: ["'1'", '1'], expected: [false, true, false, true] },
			{ operands: ["'0'", '1'], expected: [true, true, false, false] },
			{ operands: ["'1'", 'true()'], expected: [false, true, false, true] },
			{ operands: ["''", 'true()'], expected: [false, false, false, false] },
			{ operands: ["'0'", 'false()'], expected: [false, true, false, true] },
			{ operands: ["''", 'false()'], expected: [false, false, false, false] },
			// [[ "'1a'", "'1a'" ],[ false, false, false, false ]],
			{ operands: ["'1'", "'0'"], expected: [false, false, true, true] },
			// [[ "''", "''" ], [ false, false, false, false ]],
			// [[ "''", "'0'" ], [ false, false, false, false ]],
		];

		cases.forEach(({ operands, expected }) => {
			const [lhs, rhs] = operands;

			['<', '<=', '>', '>='].forEach((operator, index) => {
				const expression = `${lhs} ${operator} ${rhs}`;
				const expectedValue = expected[index as 0 | 1 | 2 | 3];

				it(`evaluates ${expression} to ${expectedValue}`, () => {
					testContext.assertBooleanValue(expression, expectedValue);
				});
			});
		});
	});

	describe('with nodes', () => {
		interface WithNodesTestCaseInput {
			readonly operands: readonly [lhs: string, rhs: string];
			readonly id?: string;
			readonly expected: readonly [lt: boolean, lte: boolean, gt: boolean, gte: boolean];
		}

		const cases: readonly WithNodesTestCaseInput[] = [
			{
				operands: ['true()', '*'],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['false()', '*'],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['*', 'true()'],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['*', 'false()'],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['0', '*'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: ['*', '0'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: ['true()', '*'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: ['false()', '*'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: ['*', 'true()'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: ['*', 'false()'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: ['-10', '*'],
				expected: [true, true, false, false],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['10', '*'],
				expected: [false, false, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['5', '*'],
				expected: [false, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['2', '*'],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ["'4'", '*'],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ["'aaa'", '*'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetStrings',
			},
			{
				operands: ["''", '*'],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: ['*', '-10'],
				expected: [false, false, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['*', '10'],
				expected: [true, true, false, false],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['*', '5'],
				expected: [true, true, false, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['*', '2'],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['*', "'4'"],
				expected: [true, true, true, true],
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
			},
			{
				operands: ['*', "'aaa'"],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetStrings',
			},
			{
				operands: ['*', "''"],
				expected: [false, false, false, false],
				id: 'ComparisonOperatorCaseNodesetEmpty',
			},
			{
				operands: [
					"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
					"id('ComparisonOperatorCaseNodesetEmpty')/*",
				],
				expected: [false, false, false, false],
			},
			{
				operands: [
					"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
					"id('ComparisonOperatorCaseNodeset4to8')/*",
				],
				expected: [true, true, true, true],
			},
			{
				operands: [
					"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
					"id('ComparisonOperatorCaseNodeset6to10')/*",
				],
				expected: [true, true, false, false],
			},
		];

		cases.forEach(({ operands, id, expected }) => {
			const [operand0, operand1] = operands;

			['<', '<=', '>', '>='].forEach((operator, index) => {
				const expression = `${operand0} ${operator} ${operand1}`;
				const expectedValue = expected[index as 0 | 1 | 2 | 3];

				it(`evaluates ${expression} with context node for id ${id} to ${expectedValue} (or document if no id specified)`, () => {
					const contextNode = id == null ? document : document.getElementById(id)!;

					testContext.assertBooleanValue(expression, expectedValue, {
						contextNode,
					});
				});
			});
		});
	});
});
