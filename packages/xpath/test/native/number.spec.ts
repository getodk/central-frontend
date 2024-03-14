import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('native number functions', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('number() conversion of convertible numbers, strings, booleans', () => {
		// of numbers
		testContext.assertNumberValue('number(-1.0)', -1);
		testContext.assertNumberValue('number(1)', 1);
		testContext.assertNumberValue('number(0.199999)', 0.199999);
		testContext.assertNumberValue('number(-0.199999)', -0.199999);
		testContext.assertNumberValue('number(- 0.199999)', -0.199999),
			testContext.assertNumberValue('number(0.0)', 0);
		testContext.assertNumberValue('number(.0)', 0);
		testContext.assertNumberValue('number(0.)', 0);

		// of booleans
		testContext.assertNumberValue('number(true())', 1);
		testContext.assertNumberValue('number(false())', 0);

		// of strings
		testContext.assertNumberValue('number("-1.0")', -1);
		testContext.assertNumberValue('number("1")', 1);
		testContext.assertNumberValue('number("0.199999")', 0.199999);
		testContext.assertNumberValue('number("-0.9991")', -0.9991);
		testContext.assertNumberValue('number("0.0")', 0);
		testContext.assertNumberValue('number(".0")', 0);
		testContext.assertNumberValue('number(".112")', 0.112);
		testContext.assertNumberValue('number("0.")', 0);
		testContext.assertNumberValue('number("  1.1")', 1.1);
		testContext.assertNumberValue('number("1.1   ")', 1.1);
		testContext.assertNumberValue('number("1.1   \n ")', 1.1);
		testContext.assertNumberValue('number("  1.1 \n\r\n  ")', 1.1);
	});

	it('number() conversions returns NaN if not convertible', () => {
		testContext.assertNumberValue('number("asdf")', NaN);
		testContext.assertNumberValue('number("1asdf")', NaN);
		testContext.assertNumberValue('number("1.1sd")', NaN);
		testContext.assertNumberValue('number(".1sd")', NaN);
		testContext.assertNumberValue('number(" . ")', NaN);
	});

	describe('Infinities', () => {
		[
			{ expression: 'number( 1 div 0)', expected: Infinity },
			{ expression: 'number(-1 div 0)', expected: -Infinity },
		].forEach(({ expression, expected }) => {
			it(`should evaluate "${expression}" as "${expected}"`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('conversion of nodesets', () => {
		let document: XMLDocument;

		beforeEach(() => {
			testContext = createTestContext(`
        <div id="FunctionNumberCase">
          <div id="FunctionNumberCaseNumber">123</div>
          <div id="FunctionNumberCaseNotNumber">  a a  </div>
          <div id="FunctionNumberCaseNumberMultiple">
            <div>-10</div>
            <div>11</div>
            <div>99</div>
          </div>
          <div id="FunctionNumberCaseNotNumberMultiple">
            <div>-10</div>
            <div>11</div>
            <div>a</div>
          </div>
          <div id="FunctionSumCaseJavarosa">
            <div>-10</div>
            <div>15</div>
            <div></div>
          </div>
        </div>`);

			document = testContext.document;
		});

		it('number() ', () => {
			let contextNode = document.getElementById('FunctionNumberCaseNumber');

			testContext.assertNumberValue('number(self::node())', 123, {
				contextNode,
			});
			testContext.assertNumberValue('number()', 123, {
				contextNode,
			});

			contextNode = document.getElementById('FunctionNumberCaseNumberMultiple');

			testContext.assertNumberValue('number(*)', -10, {
				contextNode,
			});

			contextNode = document.getElementById('FunctionNumberCaseNotNumber');

			testContext.assertNumberValue('number()', NaN, {
				contextNode,
			});
		});

		it.fails('number() conversion fails when too many arguments are provided', () => {
			testContext.evaluate('number(1, 2)');
		});

		it('sum()', () => {
			let contextNode = document.getElementById('FunctionNumberCaseNumber');

			testContext.assertNumberValue('sum(self::*)', 123, {
				contextNode,
			});

			contextNode = document.getElementById('FunctionNumberCaseNumberMultiple');

			testContext.assertNumberValue('sum(*)', 100, {
				contextNode,
			});

			contextNode = document.getElementById('FunctionNumberCaseNotNumberMultiple');

			testContext.assertNumberValue('sum(node())', NaN, {
				contextNode,
			});

			contextNode = document.getElementById('FunctionSumCaseJavarosa');

			testContext.assertNumberValue('sum(*)', NaN, {
				contextNode,
			});
		});
	});

	it.fails('sum() fails when too many arguments are provided', () => {
		testContext.evaluate('sum(1, 2)');
	});

	it.fails('sum() fails when too few arguments are provided', () => {
		testContext.evaluate('sum()');
	});

	it('ceiling()', () => {
		testContext.assertNumberValue('ceiling(-1.55)', -1);
		testContext.assertNumberValue('ceiling(2.44)', 3);
		testContext.assertNumberValue('ceiling(0.001)', 1);
		testContext.assertNumberValue('ceiling(1.5)', 2);
		testContext.assertNumberValue('ceiling(5)', 5);
		testContext.assertNumberValue('ceiling(1.00)', 1);
		testContext.assertNumberValue('ceiling(-1.05)', -1);
	});

	it.fails('ceiling() fails when too many arguments are provided', () => {
		testContext.evaluate('ceiling(1, 2)');
	});

	it.fails('ceiling() fails when not enough arguments are provided', () => {
		testContext.evaluate('ceiling()');
	});

	describe('round()', () => {
		[
			{ expression: 'round(-1.55)', expected: -2 },
			{ expression: 'round(2.44)', expected: 2 },
			{ expression: 'round(0.001)', expected: 0 },
			{ expression: 'round(1.5)', expected: 2 },
			{ expression: 'round(5)', expected: 5 },
			{ expression: 'round(1.00)', expected: 1 },
			{ expression: 'round(-1.05)', expected: -1 },
		].forEach(({ expression, expected }) => {
			it(`evaluates ${expression} to ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	it.fails('round() fails when too many arguments are provided', () => {
		testContext.evaluate('round(1, 2, 3)');
	});

	it.fails('round() fails when too few arguments are provided', () => {
		testContext.evaluate('round()');
	});
});
