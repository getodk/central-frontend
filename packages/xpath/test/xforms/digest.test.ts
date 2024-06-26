import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('digest', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	[
		{ expression: 'digest("abc", "MD5", "hex")', expected: '900150983cd24fb0d6963f7d28e17f72' },
		{
			expression: 'digest("abc", "SHA-1", "hex")',
			expected: 'a9993e364706816aba3e25717850c26c9cd0d89d',
		},
		{
			expression: 'digest("abc", "SHA-256", "hex")',
			expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		},
		{
			expression: 'digest("abc", "SHA-256")',
			expected: 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
		},
		{
			expression: 'digest("abc", "SHA-256", "base64")',
			expected: 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
		},
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertStringValue(expression, expected);
		});
	});
});
