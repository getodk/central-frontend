import { assert, describe, expect, it } from 'vitest';
import { parseToFloat, parseToInteger } from '../../src/lib/number-parsers.ts';

describe('NumberParsers', () => {
	interface SuccessTestCase {
		readonly input: string | null;
		readonly expected: number | null;
	}

	interface ErrorTestCase {
		readonly input: boolean | number | string | null | undefined;
		readonly expected: Error;
	}

	describe('parseToInteger', () => {
		it.each<SuccessTestCase>([
			{ input: '0', expected: 0 },
			{ input: '5999', expected: 5999 },
			{ input: '-99', expected: -99 },
		])('should parse integer strings', ({ input, expected }) => {
			try {
				expect(parseToInteger(input)).toEqual(expected);
			} catch {
				assert.fail('Should not have thrown an error');
			}
		});

		it('should return null when node option is not specified', () => {
			try {
				expect(parseToInteger(null)).toEqual(null);
			} catch {
				assert.fail('Should not have thrown an error');
			}
		});

		it.each<ErrorTestCase>([
			{ input: '3.14159', expected: new Error('Expected an integer, but got: 3.14159') },
			{ input: 'abc', expected: new Error('Expected an integer, but got: abc') },
			{ input: '', expected: new Error('Expected an integer, but got: ') },
			{ input: NaN, expected: new Error('Expected an integer, but got: NaN') },
			{ input: false, expected: new Error('Expected an integer, but got: false') },
			{ input: true, expected: new Error('Expected an integer, but got: true') },
			{ input: undefined, expected: new Error('Expected an integer, but got: undefined') },
		])('should throw error for non-integer numbers', ({ input, expected }) => {
			try {
				// @ts-expect-error Ignoring TS2345: Testing invalid input
				parseToInteger(input);
				assert.fail('Should have thrown an error');
			} catch (error) {
				expect(error).toEqual(expected);
			}
		});
	});

	describe('parseToFloat', () => {
		it.each<SuccessTestCase>([
			{ input: '3.14159', expected: 3.14159 },
			{ input: '0', expected: 0 },
			{ input: '5999', expected: 5999 },
			{ input: '-99', expected: -99 },
		])('should parse float and integers strings', ({ input, expected }) => {
			try {
				expect(parseToFloat(input)).toEqual(expected);
			} catch {
				assert.fail(`Should not have thrown an error`);
			}
		});

		it('should return null when node option is not specified', () => {
			try {
				expect(parseToFloat(null)).toEqual(null);
			} catch {
				assert.fail('Should not have thrown an error');
			}
		});

		it.each<ErrorTestCase>([
			{ input: 'abc', expected: new Error('Expected a float, but got: abc') },
			{ input: '', expected: new Error('Expected a float, but got: ') },
			{ input: NaN, expected: new Error('Expected a float, but got: NaN') },
			{ input: false, expected: new Error('Expected a float, but got: false') },
			{ input: true, expected: new Error('Expected a float, but got: true') },
			{ input: undefined, expected: new Error('Expected a float, but got: undefined') },
		])('should throw error for non-float or non-integer numbers', ({ input, expected }) => {
			try {
				// @ts-expect-error Ignoring TS2345: Testing invalid input
				parseToFloat(input);
				assert.fail('Should have thrown an error');
			} catch (error) {
				expect(error).toEqual(expected);
			}
		});
	});
});
