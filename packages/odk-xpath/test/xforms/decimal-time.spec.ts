import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('decimal-time()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	[
		{ expression: 'decimal-time("06:00:00.000-07:00")', expected: 0.25 },
		{ expression: 'decimal-time("06:00:00.000-01:00")', expected: 0.0 },
		{ expression: 'decimal-time("06:00:59.000-07:00")', expected: 0.25068287037037035 },
		{ expression: 'decimal-time("23:59:00.000-07:00")', expected: 0.9993055555555556 },
		{ expression: 'decimal-time("23:59:00.000-13:00")', expected: 0.24930555555555556 },
		{ expression: 'decimal-time("a")', expected: NaN },
		{ expression: 'decimal-time("24:00:00.000-07:00")', expected: NaN },
		{ expression: 'decimal-time("06:00:00.000-24:00")', expected: NaN },
		{ expression: 'decimal-time("06:60:00.000-07:00")', expected: NaN },
		{ expression: 'decimal-time("06:00:60.000-07:00")', expected: NaN },
		{ expression: 'decimal-time("23:59:00.000-07:60")', expected: NaN },
		{ expression: 'decimal-time("now()")', expected: NaN },
	].forEach(({ expression, expected }) => {
		it(`decimates time, evaluating ${expression} to ${expected}`, () => {
			testContext.assertNumberValue(expression, expected);
		});
	});

	it('should convert times provided with a node parameter', () => {
		testContext = createXFormsTestContext(`
      <data>
        <a>06:00:00.000-07:00</a>
      </data>`);

		testContext.assertNumberValue('decimal-time( /data/a )', 0.25);
	});

	it('facilitates time calculations and evaluates', () => {
		testContext.assertNumberValue(
			'decimal-time("12:00:00.000-07:00") - decimal-time("06:00:00.000-07:00")',
			0.25
		);
	});

	it.fails('with invalid args throws an error', () => {
		testContext.evaluate('decimal-time("06:00:00.000-07:00", 2)');
	});
});
