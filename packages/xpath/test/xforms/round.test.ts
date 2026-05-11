import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#round()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	describe('with a single argument', () => {
		[
			{ expression: 'round(1)', expected: 1 },
			{ expression: 'round(1.1)', expected: 1 },
			{ expression: 'round(1.5)', expected: 2 },
			{ expression: 'round(-1)', expected: -1 },
			{ expression: 'round(-1.1)', expected: -1 },
			{ expression: 'round(-1.5)', expected: -2 },
			{ expression: 'round(-1.55)', expected: -2 },
			{ expression: 'round(2.44)', expected: 2 },
			{ expression: 'round(0.001)', expected: 0 },
			{ expression: 'round(1.5)', expected: 2 },
			{ expression: 'round(5)', expected: 5 },
			{ expression: 'round(1.000)', expected: 1 },
			{ expression: 'round(-1.05)', expected: -1 },
		].forEach(({ expression, expected }) => {
			it(`evaluates ${expression} to ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	describe('with two arguments', () => {
		[
			{ expression: 'round(1, 0)', expected: 1 },
			{ expression: 'round(1.1, 0)', expected: 1 },
			{ expression: 'round(1.5, 0)', expected: 2 },
			{ expression: 'round(-1, 0)', expected: -1 },
			{ expression: 'round(-1.1, 0)', expected: -1 },
			{ expression: 'round(-1.5, 0)', expected: -2 },
		].forEach(({ expression, expected }) => {
			it(`evaluates ${expression} (digits = 0) to ${expected}`, () => {
				testContext.assertNumberValue(expression, expected);
			});
		});

		describe('with num_digits > 0', () => {
			[
				{ number: '0', digits: 1, expected: 0 },
				{ number: '1', digits: 1, expected: 1 },
				{ number: '1', digits: 2, expected: 1 },
				{ number: '23.7825', digits: 2, expected: 23.78 },
				{ number: '23.7825', digits: 1, expected: 23.8 },
				{ number: '2.15', digits: 1, expected: 2.2 },
				{ number: '2.149', digits: 1, expected: 2.1 },
				{ number: '-1.475', digits: 2, expected: -1.48 },
			].forEach(({ number, digits, expected }) => {
				// TODO: is the use of string arguments here material to the test?
				const expression = `round("${number}", "${digits}")`;

				it('should evaluate ' + expression + ' to ' + expected, () => {
					testContext.assertNumberValue(expression, expected);
				});
			});
		});

		describe('with num_digits < 0', () => {
			[
				{ number: '0', digits: -1, expected: 0 },
				{ number: '1', digits: -1, expected: 0 },
				{ number: '1', digits: -2, expected: 0 },
				{ number: '23.7825', digits: -2, expected: 0 },
				{ number: '23.7825', digits: -1, expected: 20 },
				{ number: '2.15', digits: -1, expected: 0 },
				{ number: '2.149', digits: -1, expected: 0 },
				{ number: '-1.475', digits: -2, expected: -0 },
				{ number: '21.5', digits: -1, expected: 20 },
				{ number: '626.3', digits: -3, expected: 1000 },
				{ number: '1.98', digits: -1, expected: 0 },
				{ number: '-50.55', digits: -2, expected: -100 },
			].forEach(({ number, digits, expected }) => {
				// TODO: is the use of string arguments here material to the test?
				const expression = `round("${number}", "${digits}")`;

				it('should evaluate ' + expression + ' to ' + expected, () => {
					testContext.assertNumberValue(expression, expected);
				});
			});
		});
	});

	it.fails('round() fails when too few arguments are provided', () => {
		testContext.evaluate('round()');
	});

	[
		{ expression: 'round(1.234)', expected: 1 },
		{ expression: 'round(1.234, 2)', expected: 1.23 },
		{ expression: 'round(1.234, 5)', expected: 1.234 },
		{ expression: 'round(1.234, 0)', expected: 1 },
		{ expression: 'round(33.33, -1)', expected: 30 },
		{ expression: 'round(1 div 47999799999)', expected: 0 }, //(2.08e-11)
		{ expression: 'round("a")', expected: NaN },
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertNumberValue(expression, expected);
		});
	});

	it.fails('round() with too many args throws exception', () => {
		testContext.evaluate('round(1, 2, 3)');
	});
});
