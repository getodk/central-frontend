import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#number()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	describe('called on a boolean', () => {
		[
			{ expression: 'number(true())', expected: 1 },
			{ expression: 'number(false())', expected: 0 },
			{ expression: 'number(1 = 1)', expected: 1 },
			{ expression: 'number(1 = 2)', expected: 0 },
		].forEach(({ expression, expected }) => {
			it(`${expression} should be ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('called on a number', () => {
		[
			{ expression: 'number("0")', expected: 0 },
			{ expression: 'number("1")', expected: 1 },
			{ expression: 'number("-1")', expected: -1 },
			{ expression: 'number(-1.0)', expected: -1 },
			{ expression: 'number(1)', expected: 1 },
			{ expression: 'number(0.199999)', expected: 0.199999 },
			{ expression: 'number(-0.199999)', expected: -0.199999 },
			{ expression: 'number(- 0.199999)', expected: -0.199999 },
			{ expression: 'number(0.0)', expected: 0 },
			{ expression: 'number(.0)', expected: 0 },
			{ expression: 'number(0.)', expected: 0 },
		].forEach(({ expression, expected }) => {
			it(`${expression} should be ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('called on a string', () => {
		[
			{ expression: 'number("-1.0")', expected: -1 },
			{ expression: 'number("1")', expected: 1 },
			{ expression: 'number("0.199999")', expected: 0.199999 },
			{ expression: 'number("-0.9991")', expected: -0.9991 },
			{ expression: 'number("0.0")', expected: 0 },
			{ expression: 'number(".0")', expected: 0 },
			{ expression: 'number(".112")', expected: 0.112 },
			{ expression: 'number("0.")', expected: 0 },
			{ expression: 'number("  1.1")', expected: 1.1 },
			{ expression: 'number("1.1   ")', expected: 1.1 },
			{ expression: 'number("1.1   \n ")', expected: 1.1 },
			{ expression: 'number("  1.1 \n\r\n  ")', expected: 1.1 },
		].forEach(({ expression, expected }) => {
			it(`${expression} should be ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('called on a date string', () => {
		[
			{ expression: 'number("1970-01-01")', expected: 0.29 },
			{ expression: 'number("1970-01-02")', expected: 1.29 },
			{ expression: 'number("1969-12-31")', expected: -0.71 },
			{ expression: 'number("2008-09-05")', expected: 14127.29 },
			{ expression: 'number("1941-12-07")', expected: -10251.71 },
		].forEach(({ expression, expected }) => {
			it(expression + ' should be ' + expected + ' days since the epoch', () => {
				testContext.assertNumberRounded(expression, expected, 100);
			});
		});
	});

	describe('number() conversions returns NaN if not convertible', () => {
		it('number() conversions returns NaN if not convertible', () => {
			[
				{ expression: 'number("asdf")', expected: NaN },
				{ expression: 'number("1asdf")', expected: NaN },
				{ expression: 'number("1.1sd")', expected: NaN },
				{ expression: 'number(".1sd")', expected: NaN },
				{ expression: 'number(" . ")', expected: NaN },
			].forEach(({ expression, expected }) => {
				testContext.assertNumberValue(expression, expected);
			});
		});

		it('number() conversion of nodesets', () => {
			testContext = createXFormsTestContext(`
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
        </div>`);
			const { document } = testContext;

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
	});
});
