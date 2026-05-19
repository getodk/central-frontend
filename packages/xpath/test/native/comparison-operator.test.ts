import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('Comparison operator', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	interface EqualityCase {
		readonly lhs: string;
		readonly rhs: string;
		readonly id?: string;
		readonly expected: readonly [eq: boolean, ne: boolean];
	}

	const equalityCases: readonly EqualityCase[] = [
		{ lhs: '1', rhs: '1', expected: [true, false] },
		{ lhs: '1', rhs: '0', expected: [false, true] },
		{ lhs: '1', rhs: '1', expected: [true, false] },
		{ lhs: '1', rhs: '0', expected: [false, true] },
		{ lhs: '1', rhs: 'true()', expected: [true, false] },
		{ lhs: '1', rhs: 'false()', expected: [false, true] },
		{ lhs: '0', rhs: 'false()', expected: [true, false] },
		{ lhs: 'true()', rhs: 'true()', expected: [true, false] },
		{ lhs: 'false()', rhs: 'false()', expected: [true, false] },
		{ lhs: 'true()', rhs: '1', expected: [true, false] },
		{ lhs: 'true()', rhs: '""', expected: [false, true] },
		// assertOps1('false()', 0, [false, true]);
		{ lhs: 'false()', rhs: '""', expected: [true, false] },
		{ lhs: '"1a"', rhs: '"1a"', expected: [true, false] },
		{ lhs: '"1"', rhs: '"0"', expected: [false, true] },
		{ lhs: '""', rhs: '""', expected: [true, false] },
		{ lhs: '""', rhs: '"0"', expected: [false, true] },
	];

	equalityCases.forEach(({ lhs, rhs, id, expected }) => {
		const contextSuffix = id == null ? '' : ` (with context #${id})`;
		const cases = [
			{ expression: `${lhs} = ${rhs}`, expected: expected[0] },
			{ expression: `${lhs} != ${rhs}`, expected: expected[1] },
		];

		cases.forEach(({ expression, expected: expectedResult }) => {
			it(`evaluates ${expression} to ${expectedResult}${contextSuffix}`, () => {
				const contextNode =
					id == null ? testContext.document : testContext.document.getElementById(id);

				testContext.assertBooleanValue(expression, expectedResult, {
					contextNode,
				});
			});
		});
	});

	interface RelativeCase {
		readonly lhs: string;
		readonly rhs: string;
		readonly id?: string;
		readonly expected: readonly [lt: boolean, lte: boolean, gt: boolean, gte: boolean];
	}

	const relativeCases: readonly RelativeCase[] = [
		{ lhs: '1', rhs: '2', expected: [true, true, false, false] },
		{ lhs: '1', rhs: '1', expected: [false, true, false, true] },
		{ lhs: '1', rhs: '0', expected: [false, false, true, true] },
		{ lhs: '1', rhs: "'2'", expected: [true, true, false, false] },
		{ lhs: '1', rhs: "'1'", expected: [false, true, false, true] },
		{ lhs: '1', rhs: "'0'", expected: [false, false, true, true] },
		{ lhs: '2', rhs: 'true()', expected: [false, false, true, true] },
		{ lhs: '1', rhs: 'true()', expected: [false, true, false, true] },
		{ lhs: '1', rhs: 'false()', expected: [false, false, true, true] },
		{ lhs: '0', rhs: 'false()', expected: [false, true, false, true] },
		{ lhs: '0', rhs: 'true()', expected: [true, true, false, false] },
		{ lhs: 'true()', rhs: '2', expected: [true, true, false, false] },
		{ lhs: 'true()', rhs: '1', expected: [false, true, false, true] },
		{ lhs: 'false()', rhs: '1', expected: [true, true, false, false] },
		{ lhs: 'false()', rhs: '0', expected: [false, true, false, true] },
		{ lhs: 'true()', rhs: '0', expected: [false, false, true, true] },
		{ lhs: 'true()', rhs: 'true()', expected: [false, true, false, true] },
		{ lhs: 'true()', rhs: 'false()', expected: [false, false, true, true] },
		{ lhs: 'false()', rhs: 'false()', expected: [false, true, false, true] },
		{ lhs: 'false()', rhs: 'true()', expected: [true, true, false, false] },
		{ lhs: 'true()', rhs: "'1'", expected: [false, true, false, true] },
		{ lhs: 'true()', rhs: "''", expected: [false, false, false, false] },
		{ lhs: 'false()', rhs: "'0'", expected: [false, true, false, true] },
		{ lhs: 'false()', rhs: "''", expected: [false, false, false, false] },
		{ lhs: "'2'", rhs: '1', expected: [false, false, true, true] },
		{ lhs: "'1'", rhs: '1', expected: [false, true, false, true] },
		{ lhs: "'0'", rhs: '1', expected: [true, true, false, false] },
		{ lhs: "'1'", rhs: 'true()', expected: [false, true, false, true] },
		{ lhs: "''", rhs: 'true()', expected: [false, false, false, false] },
		{ lhs: "'0'", rhs: 'false()', expected: [false, true, false, true] },
		{ lhs: "''", rhs: 'false()', expected: [false, false, false, false] },
		// assertOps2("'1a'", "'1a'", [false, false, false, false]);
		{ lhs: "'1'", rhs: "'0'", expected: [false, false, true, true] },
		// assertOps2("''", "''", [false, false, false, false]);
		// assertOps2("''", "'0'", [false, false, false, false]);
	];

	relativeCases.forEach(({ lhs, rhs, id, expected }) => {
		const contextSuffix = id == null ? '' : ` (with context #${id})`;
		const cases = [
			{ expression: `${lhs} < ${rhs}`, expected: expected[0] },
			{ expression: `${lhs} <= ${rhs}`, expected: expected[1] },
			{ expression: `${lhs} > ${rhs}`, expected: expected[2] },
			{ expression: `${lhs} >= ${rhs}`, expected: expected[3] },
		];

		cases.forEach(({ expression, expected: expectedResult }) => {
			it(`evaluates ${expression} to ${expectedResult}${contextSuffix}`, () => {
				const contextNode =
					id == null ? testContext.document : testContext.document.getElementById(id);

				testContext.assertBooleanValue(expression, expectedResult, {
					contextNode,
				});
			});
		});
	});

	describe('with nodes', () => {
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
          <div id="ComparisonOperatorCaseNodesetEmpty">
          </div>
          <div id="ComparisonOperatorCaseNodesetStrings">
            <div>aaa</div>
            <div>bbb</div>
            <div>cccccc</div>
            <div>ddd</div>
            <div>eee</div>
          </div>
        </div>`);
			document = testContext.document;
		});

		const equalityWithNodesCases: readonly EqualityCase[] = [
			// assertOps1(doc,
			//   "id('ComparisonOperatorCaseNodesetNegative5to5')/*",
			//   "id('ComparisonOperatorCaseNodesetEmpty')/*", [false, false]);
			// assertOps1(doc,
			//   "id('ComparisonOperatorCaseNodesetNegative5to5')/*",
			//   "id('ComparisonOperatorCaseNodeset4to8')/*", [true, true]);
			// assertOps1(doc,
			//   "id('ComparisonOperatorCaseNodesetNegative5to5')/*",
			//   "id('ComparisonOperatorCaseNodeset6to10')/*", [false, true ]);

			{
				lhs: '-10',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [false, true],
			},
			{
				lhs: '4',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true],
			},
			{
				lhs: '4.3',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [false, true],
			},
			{ lhs: 'true()', rhs: '*', expected: [true, false] },
			{ lhs: 'false()', rhs: '*', expected: [false, true] },

			{ lhs: '0', rhs: '*', id: 'ComparisonOperatorCaseNodesetEmpty', expected: [false, false] },
			// assertOps1(node, "true()", "*"], [false, true]);
			// assertOps1(node, "false()", "*"], [true, false]);
			// assertOps1(node, "''", "*", [false, false]);

			{
				lhs: "'aaa'",
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetStrings',
				expected: [true, true],
			},
			{
				lhs: "'bb'",
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetStrings',
				expected: [false, true],
			},
			{ lhs: "''", rhs: '*', id: 'ComparisonOperatorCaseNodesetStrings', expected: [false, true] },
		];

		equalityWithNodesCases.forEach(({ lhs, rhs, id, expected }) => {
			const contextSuffix = id == null ? '' : ` (with context #${id})`;
			const cases = [
				{ expression: `${lhs} = ${rhs}`, expected: expected[0] },
				{ expression: `${lhs} != ${rhs}`, expected: expected[1] },
			];

			cases.forEach(({ expression, expected: expectedResult }) => {
				it(`evaluates ${expression} to ${expectedResult}${contextSuffix}`, () => {
					const contextNode = id == null ? document : document.getElementById(id);

					testContext.assertBooleanValue(expression, expectedResult, {
						contextNode,
					});
				});
			});
		});

		const relativeWithNodesCases: readonly RelativeCase[] = [
			// assertOps2(doc,
			//   "id('ComparisonOperatorCaseNodesetNegative5to5')/*",
			//   "id('ComparisonOperatorCaseNodesetEmpty')/*",
			//   [false, false, false, false]);
			// assertOps2(doc,
			//   "id('ComparisonOperatorCaseNodesetNegative5to5')/*",
			//   "id('ComparisonOperatorCaseNodeset4to8')/*",
			//   [true, true, true, true]);
			// assertOps2(doc,
			//   "id('ComparisonOperatorCaseNodesetNegative5to5')/*",
			//   "id('ComparisonOperatorCaseNodeset6to10')/*",
			//   [true, true, false, false]);

			{
				lhs: '-10',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, false, false],
			},
			{
				lhs: '10',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [false, false, true, true],
			},
			{
				lhs: '5',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [false, true, true, true],
			},
			{
				lhs: '2',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},
			{
				lhs: 'true()',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},
			{
				lhs: 'false()',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},
			{
				lhs: "'4'",
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},
			{
				lhs: '*',
				rhs: '-10',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [false, false, true, true],
			},
			{
				lhs: '*',
				rhs: '10',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, false, false],
			},
			{
				lhs: '*',
				rhs: '5',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, false, true],
			},
			{
				lhs: '*',
				rhs: '2',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},
			{
				lhs: '*',
				rhs: 'true()',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},
			{
				lhs: '*',
				rhs: 'false()',
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},
			{
				lhs: '*',
				rhs: "'4'",
				id: 'ComparisonOperatorCaseNodesetNegative5to5',
				expected: [true, true, true, true],
			},

			{
				lhs: '*',
				rhs: "'aaa'",
				id: 'ComparisonOperatorCaseNodesetStrings',
				expected: [false, false, false, false],
			},
			{
				lhs: "'aaa'",
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetStrings',
				expected: [false, false, false, false],
			},

			{
				lhs: '0',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
			{
				lhs: 'true()',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
			{
				lhs: 'false()',
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
			{
				lhs: "''",
				rhs: '*',
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
			{
				lhs: '*',
				rhs: '0',
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
			{
				lhs: '*',
				rhs: 'true()',
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
			{
				lhs: '*',
				rhs: 'false()',
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
			{
				lhs: '*',
				rhs: "''",
				id: 'ComparisonOperatorCaseNodesetEmpty',
				expected: [false, false, false, false],
			},
		];

		relativeWithNodesCases.forEach(({ lhs, rhs, id, expected }) => {
			const contextSuffix = id == null ? '' : ` (with context #${id})`;
			const cases = [
				{ expression: `${lhs} < ${rhs}`, expected: expected[0] },
				{ expression: `${lhs} <= ${rhs}`, expected: expected[1] },
				{ expression: `${lhs} > ${rhs}`, expected: expected[2] },
				{ expression: `${lhs} >= ${rhs}`, expected: expected[3] },
			];

			cases.forEach(({ expression, expected: expectedResult }) => {
				it(`evaluates ${expression} to ${expectedResult}${contextSuffix}`, () => {
					const contextNode =
						id == null ? testContext.document : testContext.document.getElementById(id);

					testContext.assertBooleanValue(expression, expectedResult, {
						contextNode,
					});
				});
			});
		});
	});
});
