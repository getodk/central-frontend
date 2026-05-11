import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('#substr()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should give the rest of a string if supplied with only startIndex', () => {
		testContext = createXFormsTextContentTestContext('0123456789');

		testContext.assertStringValue('substr(/simple/xpath/to/node, 5)', '56789');
	});

	it('should give substring from start to finish if supplied with 2 indexes', () => {
		testContext = createXFormsTextContentTestContext('0123456789');

		testContext.assertStringValue('substr(/simple/xpath/to/node, 2, 4)', '23');
	});

	[
		{ expression: 'substr("hello",0)', expected: 'hello' },
		{ expression: 'substr("hello",0,5)', expected: 'hello' },
		{ expression: 'substr("hello",1)', expected: 'ello' },
		{ expression: 'substr("hello",1,5)', expected: 'ello' },
		{ expression: 'substr("hello",1,4)', expected: 'ell' },
		{ expression: 'substr("hello",-2)', expected: 'lo' },
		{ expression: 'substr("hello",0,-1)', expected: 'hell' },
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertStringValue(expression, expected);
		});
	});
});
