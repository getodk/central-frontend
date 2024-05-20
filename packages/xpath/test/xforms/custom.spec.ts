import { beforeEach, describe, expect, it } from 'vitest';
import type { AnyXPathEvaluator } from '../../src/shared/interface.ts';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe.skip('custom XPath functions', () => {
	interface CustomFunctionEvaluator extends AnyXPathEvaluator {
		readonly customXPathFunction?: {
			add(...args: unknown[]): unknown;
		};
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	interface CustomFunctionEvaluatorTestContext extends XFormsTestContext {
		readonly evaluator: CustomFunctionEvaluator;
	}

	let testContext: CustomFunctionEvaluatorTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should not allow unexpected arg types', () => {
		expect(() => {
			testContext.evaluator.customXPathFunction?.add('f', {
				fn: () => {
					// This function body doesn't matter
				},
				args: [{ t: 'string' }, { t: 'number' }, { t: 'boolean' }, { t: 'dog' }],
				ret: 'number',
			});
		}).toThrow(`Unsupported arg type(s): 'dog'`);
	});

	it('should not allow unexpected return types', () => {
		expect(() => {
			testContext.evaluator.customXPathFunction?.add('f', {
				fn: () => {
					// This function body doesn't matter
				},
				args: [],
				ret: 'fish',
			});
		}).toThrow(`Unsupported return type: 'fish'`);
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
			testContext.evaluator.customXPathFunction?.add('cos', customNoopFunction);
		}).toThrow(`There is already a function with the name: 'cos'`);
	});

	it('should not allow overriding existing custom functions', () => {
		// given
		testContext.evaluator.customXPathFunction?.add('f', customNoopFunction);

		expect(() => {
			testContext.evaluator.customXPathFunction?.add('f', customNoopFunction);
		}).toThrow(`There is already a function with the name: 'f'`);
	});

	describe('pad2()', () => {
		beforeEach(() => {
			testContext.evaluator.customXPathFunction?.add('pad2', {
				fn: (a: unknown) => (a as string).padStart(2, '0'),
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
