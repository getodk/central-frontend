import { describe, expect, it } from 'vitest';
import { DecimalValueCodec } from '../../../src/lib/codecs/DecimalValueCodec';

describe('DecimalValueCodec', () => {
	const codec = new DecimalValueCodec();

	describe('encode', () => {
		it.each([
			{ input: 1, expected: '1.0' },
			{ input: 1.1, expected: '1.1' },
			{ input: 1234567, expected: '1234567.0' },
			{ input: 1234.567, expected: '1234.567' },
			{ input: -1234.567, expected: '-1234.567' },
			{ input: 100, expected: '100.0' },
			{ input: '100', expected: '100.0' },
			{ input: null, expected: '' },
			{ input: 123456789123456789n, expected: '123456789123456789.0' },
			{ input: 'e', expected: '' },
		])('turns $input into $expected', ({ input, expected }) => {
			const actual = codec.encodeValue(input);
			expect(actual).to.equal(expected);
		});
	});

	describe('dencode', () => {
		it.each([
			{ input: '1', expected: 1 },
			{ input: '1.54', expected: 1.54 },
			{ input: '123456789', expected: 123456789 },
			{ input: '-1', expected: -1 },
			{ input: '', expected: null },
			{ input: 'e', expected: null },
		])('turns $input into $expected', ({ input, expected }) => {
			const actual = codec.decodeValue(input);
			expect(actual).to.equal(expected);
		});
	});
});
