import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#decimal-date-time()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	describe('with full date + timestamp', () => {
		[
			{ expression: 'decimal-date-time("1970-01-01T00:00:00Z")', expectedDaysSinceEpoch: 0 },
			{ expression: 'decimal-date-time("1970-01-02T00:00:00Z")', expectedDaysSinceEpoch: 1 },
			{ expression: 'decimal-date-time("1969-12-31T00:00:00Z")', expectedDaysSinceEpoch: -1 },
		].forEach(({ expression, expectedDaysSinceEpoch }) => {
			it('should convert ' + expression + ' into ' + expectedDaysSinceEpoch, () => {
				testContext.assertNumberValue(expression, expectedDaysSinceEpoch);
			});
		});
	});

	describe('with date only', () => {
		[
			{ expression: 'decimal-date-time("1970-01-01")', expectedDaysSinceEpoch: 0.291667 },
			{ expression: 'decimal-date-time("1970-01-02")', expectedDaysSinceEpoch: 1.291667 },
			{ expression: 'decimal-date-time("1969-12-31")', expectedDaysSinceEpoch: -0.708333 },
			{ expression: 'decimal-date-time("2021-10-06")', expectedDaysSinceEpoch: 18906.291667 },
		].forEach(({ expression, expectedDaysSinceEpoch }) => {
			it('should convert ' + expression + ' into ' + expectedDaysSinceEpoch, () => {
				testContext.assertNumberRounded(expression, expectedDaysSinceEpoch, 1000000);
			});
		});
	});

	describe('with no offset specified', () => {
		[
			{ expression: 'decimal-date-time("1970-01-01T00:00:00")', expectedDaysSinceEpoch: 0.291667 },
			{
				expression: 'decimal-date-time("1970-01-02T00:00:00.000")',
				expectedDaysSinceEpoch: 1.291667,
			},
			{ expression: 'decimal-date-time("1969-12-31T00:00:00")', expectedDaysSinceEpoch: -0.708333 },
			{
				expression: 'decimal-date-time("2021-10-06T00:00:00.000")',
				expectedDaysSinceEpoch: 18906.291667,
			},
		].forEach(({ expression, expectedDaysSinceEpoch }) => {
			it('should convert ' + expression + ' into ' + expectedDaysSinceEpoch, () => {
				testContext.assertNumberRounded(expression, expectedDaysSinceEpoch, 1000000);
			});
		});
	});

	it.fails('with invalid args, throws an error', () => {
		testContext.evaluate('decimal-date-time("1970-01-01T00:00:00.000Z", 2)');
	});

	it('different format', () => {
		// testContext.assertNumberRounded('decimal-date-time("2018-04-24T15:30:00.000+06:00")', 17645.396, 1000);
		testContext.assertNumberValue(
			'decimal-date-time("2018-04-24T15:30:00.000+06:00")',
			17645.395833333332
		);
	});
});
