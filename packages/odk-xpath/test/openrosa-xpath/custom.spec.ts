import { beforeEach, describe, expect, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('custom XPath functions', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should not allow unexpected arg types', () => {
		expect(() => {
			testContext.evaluator.customXPathFunction.add('f', {
				fn: () => {
					// This function body doesn't matter
				},
				args: [{ t: 'string' }, { t: 'number' }, { t: 'boolean' }, { t: 'dog' }],
				ret: 'number',
			});
		}).to.throw(`Unsupported arg type(s): 'dog'`);
	});

	it('should not allow unexpected return types', () => {
		expect(() => {
			testContext.evaluator.customXPathFunction.add('f', {
				fn: () => {
					// This function body doesn't matter
				},
				args: [],
				ret: 'fish',
			});
		}).to.throw(`Unsupported return type: 'fish'`);
	});

	const customNoopFunction = {
		fn: () => {
			// This function body doesn't matter
		},
		args: [],
		ret: 'string',
	};

	it('should not allow overriding existing functions', () => {
		expect(() => {
			testContext.evaluator.customXPathFunction.add('cos', customNoopFunction);
		}).to.throw(`There is already a function with the name: 'cos'`);
	});

	it('should not allow overriding existing custom functions', () => {
		// given
		testContext.evaluator.customXPathFunction.add('f', customNoopFunction);

		expect(() => {
			testContext.evaluator.customXPathFunction.add('f', customNoopFunction);
		}).to.throw(`There is already a function with the name: 'f'`);
	});

	describe('pad2()', () => {
		beforeEach(() => {
			testContext.evaluator.customXPathFunction.add('pad2', {
				fn: (a) => (a as string).padStart(2, '0'),
				args: [{ t: 'string' }],
				ret: 'string',
			});
		});

		[
			{ argument: '""', expected: '00' },
			{ argument: '"1"', expected: '01' },
			{ argument: '"11"', expected: '11' },
			{ argument: '"111"', expected: '111' },
			{ argument: 0, expected: '00' },
			{ argument: 1, expected: '01' },
			{ argument: 11, expected: '11' },
			{ argument: 111, expected: '111' },
		].forEach(({ argument, expected }) => {
			it(`should convert ${argument} to '${expected}'`, () => {
				testContext.assertStringValue(`pad2(${argument})`, expected);
			});
		});

		it.fails('should throw if too few args are provided', () => {
			testContext.evaluate('pad2()');
		});

		it.fails('should throw if too many args are provided', () => {
			testContext.evaluate('pad2("1", 2)');
		});
	});
});
