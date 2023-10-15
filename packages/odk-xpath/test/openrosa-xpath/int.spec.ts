import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, createTextContentTestContext } from '../helpers.ts';

const PATH = '/simple/xpath/to/node';

describe('#int()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should convert a string to an integer', () => {
		testContext = createTextContentTestContext('123');

		testContext.assertNumberValue(`int(${PATH})`, 123);
	});

	it('should convert a decimal to an integer', () => {
		testContext = createTextContentTestContext('123.456');

		testContext.assertNumberValue(`int(${PATH})`, 123);
	});

	[
		{ expression: 'int(2.1)', expected: 2 },
		{ expression: 'int(2.51)', expected: 2 },
		{ expression: 'int(2)', expected: 2 },
		{ expression: 'int("2.1")', expected: 2 },
		{ expression: 'int("2.51")', expected: 2 },
		{ expression: 'int(-1.4)', expected: -1 },
		{ expression: 'int(-1.51)', expected: -1 },
		{ expression: 'int("a")', expected: NaN },
		{ expression: 'int(7.922021953507237e-12)', expected: 0 },
		{ expression: 'int(1 div 47999799999)', expected: 0 },
		{ expression: 'int("7.922021953507237e-12")', expected: 0 },
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertNumberValue(expression, expected);
		});
	});
});
