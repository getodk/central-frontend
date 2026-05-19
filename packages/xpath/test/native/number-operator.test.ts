import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('number operators', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	describe('+', () => {
		[
			{ expression: '1+1', expected: 2 },
			{ expression: '0+1', expected: 1 },
			{ expression: '0+0', expected: 0 },
			{ expression: '0+-0', expected: 0 },
			{ expression: '-1 + 1', expected: 0 },
			{ expression: '-1 +-1', expected: -2 },
			{ expression: '1.05+2.05', expected: 3.0999999999999996 },
			// { expression: ".5   \n +.5+.3", expected: 1.3 },
			{ expression: '5+4+1+-1+-4', expected: 5 },
			// { expression: "'1'+'1'", expected: 2 },
			{ expression: '.55+ 0.56', expected: 1.11 },
			{ expression: '1.0+1.0', expected: 2 },
			{ expression: 'true()+true()', expected: 2 },
			{ expression: 'false()+1', expected: 1 },
			{ expression: '(1 div 0) * 0', expected: NaN },
			{ expression: '(1 div 0) + 1', expected: Number.POSITIVE_INFINITY },
			{ expression: '(-1 div 0) + 1', expected: Number.NEGATIVE_INFINITY },
			{ expression: '1 + (-1 div 0)', expected: Number.NEGATIVE_INFINITY },
			{ expression: '(1 div 0) + (-1 div 0)', expected: NaN },
			{ expression: "number('a') + 0", expected: NaN },
			{ expression: "0 + number('a')", expected: NaN },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('-', () => {
		it('without spacing works', () => {
			testContext.assertNumberValue('1-1', 0);
		});

		it('with spacing works', () => {
			testContext.assertNumberValue('1 - 1', 0);
		});

		it('with combo with/without spacing 1 works', () => {
			testContext.assertNumberValue('1 -1', 0);
		});

		it('with combo with/without spacing 2 works', () => {
			testContext.assertNumberValue('1- 1', 0);
		});

		// This seems to have meant to test a parsing failure, but the evaluation
		// call itself was wrong (passing the document in the expression argument
		// position, which is what would have thrown). The following test is what
		// would reasonably be expected behavior.
		it.fails.skip('with string without spacing BEFORE - fails', () => {
			testContext.evaluate("'asdf'- 'asdf'", null, XPathResult.NUMBER_TYPE);
		});

		it('with string without spacing BEFORE - fails', () => {
			testContext.assertNumberValue("'asdf'- 'asdf'", NaN);
		});

		it('with string without spacing AFTER - fails ', () => {
			testContext.assertNumberValue("'asdf' -'asdf'", NaN);
		});

		it('with strings', () => {
			testContext.assertNumberValue("'asdf' - 'asdf'", NaN);
		});

		[
			{ expression: '1-1', expected: 0 },
			{ expression: '0 -1', expected: -1 },
			{ expression: '0-0', expected: 0 },
			{ expression: '0- -0', expected: 0 },
			{ expression: '-1-1', expected: -2 },
			{ expression: '-1 --1', expected: 0 },
			{ expression: '1.05-2.05', expected: -0.9999999999999998 },
			{ expression: '.5-.5-.3', expected: -0.3 },
			{ expression: '5- 4-1--1--4', expected: 5 },
			{ expression: "'1'-'1'", expected: 0 },
			{ expression: '.55  - 0.56', expected: -0.010000000000000009 },
			{ expression: '1.0-1.0', expected: 0 },
			{ expression: 'true()  \n\r\t -true()', expected: 0 },
			{ expression: 'false()-1', expected: -1 },
			{ expression: '(1 div 0) - 1', expected: Number.POSITIVE_INFINITY },
			{ expression: '(-1 div 0) - 1', expected: Number.NEGATIVE_INFINITY },
			{ expression: "number('a') - 0", expected: NaN },
			{ expression: "0 - number('a')", expected: NaN },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('mod', () => {
		it('without spacing works', () => {
			testContext.assertNumberValue('1mod1', 0);
		});

		it('without spacing AFTER mod works', () => {
			testContext.assertNumberValue('1 mod1', 0);
		});

		it('without spacing BEFORE mod works', () => {
			testContext.assertNumberValue('1mod 1', 0);
		});

		it('with numbers-as-string works', () => {
			testContext.assertNumberValue("'1'mod'1'", 0);
		});

		it.fails('without spacing after mod and a string fails', () => {
			// Note: this (now?) fails because it's a syntax error. The following would
			// return a number result with a `numberValue` of `NaN` instead:
			//
			// '1' mod/html
			//
			// Notice that the expression below includes an errant single quote char:
			//
			// '1' mod/html'
			testContext.evaluate("'1' mod/html'", null, XPathResult.NUMBER_TYPE);
		});

		it('without spacing before mod and a string works', () => {
			testContext.assertNumberValue("'1'mod '1'", 0);
		});

		[
			{ expression: '5 mod 2', expected: 1 },
			{ expression: '5 mod -2 ', expected: 1 },
			{ expression: '-5 mod 2', expected: -1 },
			{ expression: ' -5 mod -2 ', expected: -1 },
			{ expression: '5 mod 1.5', expected: 0.5 },
			{ expression: '6.4 mod 2.1', expected: 0.10000000000000009 },
			{ expression: '5.3 mod 1.1', expected: 0.8999999999999995 },
			{ expression: '-0.4 mod .2', expected: -0 },
			{ expression: '1 mod -1', expected: 0 },
			{ expression: '0 mod 1', expected: 0 },
			{ expression: '10 mod (1 div 0)', expected: 10 },
			{ expression: '-10 mod (-1 div 0)', expected: -10 },
		].forEach(({ expression, expected }) => {
			it(`Should evaluate '${expression}} as '${expected}'`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});

		['0 mod 0', '1 mod 0', '(1 div 0) mod 1', '(-1 div 0) mod 1'].forEach((expression) => {
			it(`should evaluate '${expression}' as NaN`, () => {
				testContext.assertNumberValue(expression, NaN);
			});
		});
	});

	it('div without spacing', () => {
		testContext.assertNumberValue('1div1', 1);
	});

	it('div without spacing AFTER div', () => {
		testContext.assertNumberValue('1 div1', 1);
	});

	it('div without spacing BEFORE div', () => {
		testContext.assertNumberValue('1div 1', 1);
	});

	it('div without spacing and numbers-as-string', () => {
		testContext.assertNumberValue("'1'div'1'", 1);
	});

	it('div without spacing AFTER div and number-as-string', () => {
		testContext.assertNumberValue("'1' div'1'", 1);
	});

	it('div without spacing BEFORE div and number-as-string', () => {
		testContext.assertNumberValue("'1'div '1'", 1);
	});

	describe('div', () => {
		[
			{ expression: '1div 1', expected: 1 },
			{ expression: '0 div 1', expected: 0 },
			{ expression: '-1 div 1', expected: -1 },
			{ expression: '-1 div 1', expected: -1 },
			{ expression: '1.05 div 2.05', expected: 0.5121951219512195 },
			{ expression: '.5 div .5 div .3', expected: 3.3333333333333335 },
			{ expression: '5 div 4 div 1 div -1 div -4', expected: 0.3125 },
			{ expression: "'1' div '1'", expected: 1 },
			{ expression: '.55 div 0.56', expected: 0.9821428571428571 },
			{ expression: '1.0 div 1.0', expected: 1 },
			{ expression: 'true() div true()', expected: 1 },
			{ expression: 'false() div 1', expected: 0 },
			{ expression: '1 div 0', expected: Number.POSITIVE_INFINITY },
			{ expression: '-1 div 0', expected: Number.NEGATIVE_INFINITY },
			{ expression: '0 div 0', expected: NaN },
			{ expression: '0 div -0', expected: NaN },
			{ expression: "number('a') div 0", expected: NaN },
			{ expression: '1*1', expected: 1 },
			{ expression: '9 * 2', expected: 18 },
			{ expression: '9 * -1', expected: -9 },
			{ expression: '-10 *-11', expected: 110 },
			{ expression: '-1 * 1', expected: -1 },
			{ expression: '0*0', expected: 0 },
			{ expression: '0*1', expected: 0 },
			{ expression: '-1*0', expected: -0 },
			{ expression: '-15.*1.5', expected: -22.5 },
			{ expression: '1.5 * 3', expected: 4.5 },
			{ expression: '(1 div 0) * 1', expected: Number.POSITIVE_INFINITY },
			{ expression: '(-1 div 0) * -1', expected: Number.POSITIVE_INFINITY },
			{ expression: '(1 div 0) * -1', expected: Number.NEGATIVE_INFINITY },
			{ expression: "number('a') * 0", expected: NaN },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' as '${expected}'`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('*,+,-,mod,div precedence rules are applied correctly', () => {
		[
			{ expression: '1+2*3', expected: 7 },
			{ expression: '2*3+1', expected: 7 },
			{ expression: '1-10 mod 3 div 3', expected: 0.6666666666666667 },
			{ expression: '4-3*4+5-1', expected: -4 },
			{ expression: '(4-3)*4+5-1', expected: 8 },
			{ expression: '8 div 2 + 4', expected: 8 },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' as '${expected}'`, () =>
				testContext.assertNumberValue(expression, expected));
		});
	});

	it('works with different return type', () => {
		testContext.assertBooleanValue('1 + 1', true);
		testContext.assertBooleanValue('0 + 1', true);
		testContext.assertBooleanValue('0 + 0', false);
	});

	describe('with nodesets', () => {
		beforeEach(() => {
			testContext = createTestContext(`
        <data>
          <p>1</p>
          <p>2</p>
          <p>3</p>
          <p>4</p>
        </data>`);
		});

		[
			{ expression: '/data/p[1] + /data/p[2]', expected: 3 },
			{ expression: '/data/p[1]+ /data/p[2]', expected: 3 },
			{ expression: '/data/p[1] +/data/p[2]', expected: 3 },
			{ expression: '/data/p[1]+/data/p[2]', expected: 3 },
			{ expression: '/data/p[4] - /data/p[2]', expected: 2 },
			{ expression: '/data/p[4]- /data/p[2]', expected: 2 },
			{ expression: '/data/p[4] -/data/p[2]', expected: 2 },
			{ expression: '/data/p[4]-/data/p[2]', expected: 2 },
			{ expression: '/data/p[2] * /data/p[3]', expected: 6 },
			{ expression: '/data/p[2]* /data/p[3]', expected: 6 },
			{ expression: '/data/p[2] */data/p[3]', expected: 6 },
			{ expression: '/data/p[2]*/data/p[3]', expected: 6 },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});
});
