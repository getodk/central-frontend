import { beforeEach, describe, it } from 'vitest';
import { type XFormsTestContext, createXFormsTestContext } from '../helpers.ts';

describe('#base64-decode()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('ASCII string', () => {
		testContext.assertStringValue(`base64-decode('SGVsbG8=')`, 'Hello');
	});

	it('Example from Saxonica', () => {
		testContext.assertStringValue(`base64-decode('RGFzc2Vs')`, 'Dassel');
	});

	it('String with accented characters', () => {
		testContext.assertStringValue(`base64-decode('w6nDqMOx')`, 'éèñ');
	});

	it('String with emoji', () => {
		testContext.assertStringValue(`base64-decode('8J+lsA==')`, '🥰');
	});

	it('is decoded to unicode code points', () => {
		testContext.assertStringValue(`base64-decode('AGEAYgBj')`, '\u0000a\u0000b\u0000c');
	});

	it.fails('produces an error throws when not exactly one arg', () => {
		testContext.evaluate(`base64-decode()`);
	});

	it('returns an empty string for invalid input when input invalid', () => {
		testContext.assertStringValue(`base64-decode(a)`, '');
	});
});
