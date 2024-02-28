import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('and/or operators', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('and works without spacing', () => {
		testContext.assertBooleanValue('1and1', true);
	});

	it('and works without spacing AFTER and', () => {
		testContext.assertBooleanValue('1 and1', true);
	});

	it('and works with linebreak/tab spacing', () => {
		testContext.assertBooleanValue('1 and\r\n\t1', true);
	});

	it('and works without spacing BEFORE and', () => {
		testContext.assertBooleanValue('1and 1', true);
	});

	it('and works with numbers-as-string', () => {
		testContext.assertBooleanValue("'1'and'1'", true);
	});

	it.fails('And (capitalized) fails miserably', () => {
		testContext.evaluate('1 And 1');
		// TODO: previously had comment, but no apparent assertion about...
		//does not throw instance of error
	});

	describe('and without potential spacing issues works', () => {
		[
			{ expression: 'true() and true()', expected: true },
			{ expression: 'false() and true()', expected: false },
			{ expression: 'true() and false()', expected: false },
			{ expression: 'false() and false()', expected: false },
			{ expression: '1 and 1', expected: true },
			{ expression: '0 and 1', expected: false },
			{ expression: '-1 and 0', expected: false },
			{ expression: '0 and 0', expected: false },
			{ expression: '1 and -1', expected: true },
			{ expression: '1 and (1 div 0)', expected: true },
			{ expression: '(-1 div 0) and 1', expected: true },
			{ expression: 'number("") and 1', expected: false },
			{ expression: 'number("") and 0', expected: false },
			{ expression: '1 and 1 and 0', expected: false },
			{ expression: '1 and 1 and true()', expected: true },
			{ expression: 'false() and 1 and true()', expected: false },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' as ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('and laziness', () => {
		[
			'false() and substring()',
			'false() and substring() and true()',
			'true() and false() and substring()',
		].forEach((expression) => {
			it(`should evaluate '${expression}' as FALSE`, () => {
				testContext.assertBooleanValue(expression, false);
			});
		});
	});

	it('or works without spacing', () => {
		testContext.assertBooleanValue('1or1', true);
	});

	it('or works without spacing AFTER or', () => {
		testContext.assertBooleanValue('1 or1', true);
	});

	it('or works with newline/tab spacing', () => {
		testContext.assertBooleanValue('1 or\r\n\t1', true);
	});

	it('or works without spacing BEFORE or', () => {
		testContext.assertBooleanValue('1or 1', true);
	});

	it('or works with numbers-as-string', () => {
		testContext.assertBooleanValue("'1'or'1'", true);
	});

	it.fails('And (capitalized) fails miserably', () => {
		testContext.evaluate('1 OR 1', null, XPathResult.BOOLEAN_TYPE);
		// TODO: previously had comment, but no apparent assertion about...
		// does not throw instance of error
	});

	describe('or without potential spacing issues works', () => {
		[
			{ expression: 'true() or true()', expected: true },
			{ expression: 'false() or true()', expected: true },
			{ expression: 'true() or false()', expected: true },
			{ expression: 'false() or false()', expected: false },
			{ expression: '1 or 1', expected: true },
			{ expression: '0 or 1', expected: true },
			{ expression: '0 or -1', expected: true },
			{ expression: '0 or 0', expected: false },
			{ expression: '1 or -1', expected: true },
			{ expression: '1 or (1 div 0)', expected: true },
			{ expression: '(-1 div 0) or 1', expected: true },
			{ expression: "number('') or 1", expected: true },
			{ expression: "number('') or 0", expected: false },
			{ expression: '1 or 1 or 0', expected: true },
			{ expression: '1 or 1 or true()', expected: true },
			{ expression: 'false() or 0 or 0', expected: false },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' as ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('or laziness', () => {
		[
			{ expression: 'true() or substring()', expected: true },
			{ expression: 'true() or substring() and true()', expected: true },
			{ expression: 'false() or true() or substring()', expected: true },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' as ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('or/and precedence rules are applied correctly', () => {
		[
			{ expression: 'false() or  false() or  false()', expected: false },
			{ expression: 'false() or  false() and false()', expected: false },
			{ expression: 'false() and false() or  false()', expected: false },
			{ expression: 'false() and false() and false()', expected: false },
			{ expression: 'false() or  false() or   true()', expected: true },
			{ expression: 'false() or  false() and  true()', expected: false },
			{ expression: 'false() and false() or   true()', expected: true },
			{ expression: 'false() and false() and  true()', expected: false },
			{ expression: 'false() or   true() or  false()', expected: true },
			{ expression: 'false() or   true() and false()', expected: false },
			{ expression: 'false() and  true() or  false()', expected: false },
			{ expression: 'false() and  true() and false()', expected: false },
			{ expression: 'false() or   true() or   true()', expected: true },
			{ expression: 'false() or   true() and  true()', expected: true },
			{ expression: 'false() and  true() or   true()', expected: true },
			{ expression: 'false() and  true() and  true()', expected: false },
			{ expression: ' true() or  false() or  false()', expected: true },
			{ expression: ' true() or  false() and false()', expected: true },
			{ expression: ' true() and false() or  false()', expected: false },
			{ expression: ' true() and false() and false()', expected: false },
			{ expression: ' true() or  false() or   true()', expected: true },
			{ expression: ' true() or  false() and  true()', expected: true },
			{ expression: ' true() and false() or   true()', expected: true },
			{ expression: ' true() and false() and  true()', expected: false },
			{ expression: ' true() or   true() or  false()', expected: true },
			{ expression: ' true() or   true() and false()', expected: true },
			{ expression: ' true() and  true() or  false()', expected: true },
			{ expression: ' true() and  true() and false()', expected: false },
			{ expression: ' true() or   true() or   true()', expected: true },
			{ expression: ' true() or   true() and  true()', expected: true },
			{ expression: ' true() and  true() or   true()', expected: true },
			{ expression: ' true() and  true() and  true()', expected: true },
			{ expression: 'false() or (false() and false())', expected: false },
			{ expression: '(false() and false()) or false()', expected: false },
			{ expression: 'false() or (false() and true())', expected: false },
			{ expression: '(false() and false()) or true()', expected: true },
			{ expression: 'false() or (true() and false())', expected: false },
			{ expression: '(false() and true()) or false()', expected: false },
			{ expression: 'false() or (true() and true())', expected: true },
			{ expression: '(false() and true()) or true()', expected: true },
			{ expression: ' true() or (false() and false())', expected: true },
			{ expression: ' (true() and false()) or false()', expected: false },
			{ expression: ' true() or (false() and true())', expected: true },
			{ expression: ' (true() and false()) or true()', expected: true },
			{ expression: ' true() or (true() and false())', expected: true },
			{ expression: ' (true() and true()) or false()', expected: true },
			{ expression: ' true() or (true() and true())', expected: true },
			{ expression: ' (true() and true()) or true()', expected: true },
			{ expression: '0 or 1 and 0', expected: false },
			{ expression: '0 or 1 and 0+1', expected: true },
			{ expression: '0 and explode() + 1', expected: false },
			{ expression: '0 and 1 + explode()', expected: false },
			{ expression: '0 and explode() + explode()', expected: false },
			{
				expression:
					'0 and explode(explode()) + explode(explode(explode(1, 2, 3, explode(), explode())))',
				expected: false,
			},
			{ expression: '0 and /explode + 1', expected: false },
			{ expression: '0 and 1 + /explode', expected: false },
			{ expression: '0 and /explode + /explode', expected: false },
			{
				expression:
					'0 and explode(/explode) + explode(explode(explode(1, 2, 3, explode(), /explode)))',
				expected: false,
			},
			{ expression: '0 and /explode[/explode]', expected: false },
			{ expression: '0 and fn(/explode)', expected: false },
			{ expression: '0 and 1 + explode(/explode)', expected: false },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});
});
