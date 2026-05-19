import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('not', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('not()', () => {
		testContext.assertBooleanValue('not(true())', false);
		testContext.assertBooleanValue('not(false())', true);
		testContext.assertBooleanValue('not(not(true()))', true);
		testContext.assertBooleanValue('not(not(false()))', false);
		testContext.assertBooleanValue('not(1)', false);
	});

	it.fails('not() fails when too few arguments are provided', () => {
		testContext.evaluate('not()');
	});

	it.fails('not() fails when too many arguments are provided', () => {
		testContext.evaluate('not(1, 2)');
	});

	describe('referencing nodesets', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`
        <countries>
          <country>
          </country>
        </countries>
      `);
		});

		[
			{ expression: 'not(/cities)', expected: true },
			{ expression: 'not(not(/cities))', expected: false },
			{ expression: 'not(/countries)', expected: false },
			{ expression: 'not(not(/countries))', expected: true },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' as '${expected}'`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});
});
