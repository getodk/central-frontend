import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('#regex()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should return `true` if value matches supplied regex', () => {
		// given
		testContext = createXFormsTextContentTestContext('123');

		// expect
		testContext.assertBooleanValue('regex(/simple/xpath/to/node, "[0-9]{3}")', true);
	});
	// This test assumes that regex matching is for the whole value, so start
	// and end marks do not need to be included.  This seems logical, but is
	// not explicitly stated in the spec.
	it('should return `false` if value matches supplied regex', () => {
		// given
		testContext = createXFormsTextContentTestContext('1234');

		// expect
		testContext.assertBooleanValue('regex(/simple/xpath/to/node, "[0-9]{3}")', true);
	});

	it('regex()', () => {
		testContext.assertBooleanValue('regex("12345", "[0-9]+")', true);
		testContext.assertBooleanValue('regex("abcde", "[0-9]+")', false);
	});
});
