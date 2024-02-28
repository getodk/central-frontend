import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#date-time()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	describe('valid date string', () => {
		it('should be left alone', () => {
			testContext.assertStringValue("date-time('1970-01-01')", '1970-01-01');
		});
	});

	describe('valid date-time string', () => {
		it('should be converted to date-time string in the local time zone', () => {
			testContext.assertStringValue(
				"date-time('1970-01-01T21:50:49Z')",
				'1970-01-01T14:50:49.000-07:00'
			);
		});
	});

	describe('positive number', () => {
		it('should be converted', () => {
			testContext.assertStringValue('date-time(0)', '1969-12-31T17:00:00.000-07:00');
			testContext.assertStringValue('date-time(1)', '1970-01-01T17:00:00.000-07:00');
		});
	});

	describe('invalid date-time', () => {
		it('should not parse, but instead should return a String', () => {
			testContext.assertStringValue("date-time('nonsense')", 'Invalid Date');
		});
	});
});
