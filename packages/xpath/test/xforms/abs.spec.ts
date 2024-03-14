import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#abs()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('abs', () => {
		testContext.assertNumberValue('abs(10.5)', 10.5);
		testContext.assertNumberValue('abs(-10.5)', 10.5);
		testContext.assertNumberValue('abs("-10.5")', 10.5);
		testContext.assertNumberValue('abs("a")', NaN);
	});
});
