import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('date comparison', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	const relativeDateAsString = (offset: number) => {
		const d = new Date();

		d.setDate(d.getDate() + offset);

		return (
			d.getFullYear() +
			'-' +
			(d.getMonth() + 1).toString().padStart(2, '0') +
			'-' +
			d.getDate().toString().padStart(2, '0')
		);
	};

	const yesterdayExpression = JSON.stringify(relativeDateAsString(-1));
	const todayExpression = JSON.stringify(relativeDateAsString(0));
	const tomorrowExpression = JSON.stringify(relativeDateAsString(1));

	describe('yesterday', () => {
		it('should be less than today()', () => {
			testContext.assertBooleanValue(yesterdayExpression + ' < today()', true);
		});

		it('should be less than or equal to today()', () => {
			testContext.assertBooleanValue(yesterdayExpression + ' <= today()', true);
		});

		it('should not be greater than today()', () => {
			testContext.assertBooleanValue(yesterdayExpression + ' > today()', false);
		});

		it('should not be greater than or equal to today()', () => {
			testContext.assertBooleanValue(yesterdayExpression + ' >= today()', false);
		});
	});

	describe('today', () => {
		it('should be less than today()', () => {
			testContext.assertBooleanValue(todayExpression + ' < today()', false);
		});

		it('should be less than or equal to today()', () => {
			testContext.assertBooleanValue(todayExpression + ' <= today()', true);
		});

		it('should not be greater than today()', () => {
			testContext.assertBooleanValue(todayExpression + ' > today()', false);
		});

		it('should be greater than or equal to today()', () => {
			testContext.assertBooleanValue(todayExpression + ' >= today()', true);
		});
	});

	describe('today()', () => {
		it('should not be less than yesterday', () => {
			testContext.assertBooleanValue('today() < ' + yesterdayExpression, false);
		});

		it('should not be less than or equal to yesterday', () => {
			testContext.assertBooleanValue('today() <= ' + yesterdayExpression, false);
		});

		it('should be greater than yesterday', () => {
			testContext.assertBooleanValue('today() > ' + yesterdayExpression, true);
		});

		it('should be greater than or equal to yesterday', () => {
			testContext.assertBooleanValue('today() >= ' + yesterdayExpression, true);
		});

		it('should not be less than today', () => {
			testContext.assertBooleanValue('today() < ' + todayExpression, false);
		});

		it('because it is a precise moment, should not be less than or equal to today', () => {
			testContext.assertBooleanValue('today() <= ' + todayExpression, true);
		});

		it('because it is a precise moment, should be greater than today', () => {
			testContext.assertBooleanValue('today() > ' + todayExpression, false);
		});

		it('because it is a precise moment, should be greater than or equal to today', () => {
			testContext.assertBooleanValue('today() >= ' + todayExpression, true);
		});

		it('should be less than tomorrow', () => {
			testContext.assertBooleanValue('today() < ' + tomorrowExpression, true);
		});

		it('should be less than or equal to tomorrow', () => {
			testContext.assertBooleanValue('today() <= ' + tomorrowExpression, true);
		});

		it('should not be greater than tomorrow', () => {
			testContext.assertBooleanValue('today() > ' + tomorrowExpression, false);
		});

		it('should not be greater than or equal to tomorrow', () => {
			testContext.assertBooleanValue('today() >= ' + tomorrowExpression, false);
		});
	});

	describe('tomorrow', () => {
		it('should not be less than today()', () => {
			testContext.assertBooleanValue(tomorrowExpression + ' < today()', false);
		});

		it('should not be less than or equal to today()', () => {
			testContext.assertBooleanValue(tomorrowExpression + ' <= today()', false);
		});

		it('should be greater than today()', () => {
			testContext.assertBooleanValue(tomorrowExpression + ' > today()', true);
		});

		it('should be greater than or equal to today()', () => {
			testContext.assertBooleanValue(tomorrowExpression + ' >= today()', true);
		});
	});

	describe('comparisons with a field', () => {
		describe('set to today', () => {
			beforeEach(() => {
				testContext = createXFormsTextContentTestContext(relativeDateAsString(0));
			});

			it('should be less than tomorrow', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node < today() + 1', true);
			});

			it('should not be greater than tomorrow', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node > today() + 1', false);
			});

			it('should be greater than yesterday', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node > today() - 1', true);
			});

			it('should not be less than yesterday', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node < today() - 1', false);
			});

			describe('with brackets', () => {
				it('should be less than tomorrow', () => {
					testContext.assertBooleanValue('/simple/xpath/to/node < (today() + 1)', true);
				});

				it('should not be greater than tomorrow', () => {
					testContext.assertBooleanValue('/simple/xpath/to/node > (today() + 1)', false);
				});

				it('should be greater than yesterday', () => {
					testContext.assertBooleanValue('/simple/xpath/to/node > (today() - 1)', true);
				});

				it('should not be less than yesterday', () => {
					testContext.assertBooleanValue('/simple/xpath/to/node < (today() - 1)', false);
				});
			});
		});
	});
});
