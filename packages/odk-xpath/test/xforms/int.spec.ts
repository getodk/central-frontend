import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

const PATH = '/simple/xpath/to/node';

describe('#int()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should convert a string to an integer', () => {
		testContext = createXFormsTextContentTestContext('123');

		testContext.assertNumberValue(`int(${PATH})`, 123);
	});

	it('should convert a decimal to an integer', () => {
		testContext = createXFormsTextContentTestContext('123.456');

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
		{ expression: 'int(1 div 47999799999)', expected: 0 },
		{ expression: 'int("7.922021953507237e-12")', expected: 0 },
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertNumberValue(expression, expected);
		});
	});

	// Enketo supports numeric literals with an exponent component. This is likely
	// because it defers to `Number(sourceToken)` or similar for parsing numeric
	// values. Exponent notation, however, is not supported by the XPath grammar.
	it.fails('evaluates a number with exponent notation', () => {
		const expression = 'int(7.922021953507237e-12)';
		const expected = 0;

		testContext.assertNumberValue(expression, expected);
	});
});
