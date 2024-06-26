import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('#pow()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	describe('should return power of text values', () => {
		it('3^0', () => {
			testContext = createXFormsTextContentTestContext('3');

			testContext.assertNumberValue('pow(/simple/xpath/to/node, 0)', 1);
		});

		it('1^3', () => {
			testContext = createXFormsTextContentTestContext('1');

			testContext.assertNumberValue('pow(/simple/xpath/to/node, 3)', 1);
		});

		it('4^2', () => {
			testContext = createXFormsTextContentTestContext('4');

			testContext.assertNumberValue('pow(/simple/xpath/to/node, 2)', 16);
		});

		it('no input pow', () => {
			testContext.assertNumberValue('pow(2, 2)', 4);
			testContext.assertNumberValue('pow(2, 0)', 1);
			testContext.assertNumberValue('pow(0, 4)', 0);
			testContext.assertNumberValue('pow(2.5, 2)', 6.25);
			testContext.assertNumberValue('pow(0.5, 2)', 0.25);
			testContext.assertNumberValue('pow(-1, 2)', 1);
			testContext.assertNumberValue('pow(-1, 3)', -1);
			testContext.assertNumberValue('pow(4, 0.5)', 2);
			testContext.assertNumberValue('pow(16, 0.25)', 2);
		});
	});
});
