import * as CryptoJS from 'crypto-js';
import { describe, expect, it } from 'vitest';
import {
	arrayBufferToWordArray,
	wordArrayToArrayBuffer,
} from '../../../../../src/lib/client-reactivity/instance-state/quarantine/wordArrayUtils';

describe('symmetric encryption', () => {
	// not unit tested, because it requires decryption so is better suited to an e2e test
	// describe('encryptAttachment()', () => {});

	describe('wordarray utils', () => {
		describe('arrayBufferToWordArray', () => {
			it('should correctly convert a Uint8Array to a WordArray', () => {
				const data = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);

				const wordArray = arrayBufferToWordArray(data);

				expect(wordArray.words.length).toBe(2);
				expect(wordArray.words[0]).toBe(0x11223344);
				expect(wordArray.words[1]).toBe(0x55667788);
				expect(wordArray.sigBytes).toBe(8);
			});

			it('should handle data that is not a multiple of 4 bytes (padding)', () => {
				const data = new Uint8Array([0xaa, 0xbb, 0xcc]);

				const wordArray = arrayBufferToWordArray(data);

				expect(wordArray.words.length).toBe(1);
				const unsignedWord = wordArray.words[0]! >>> 0;
				expect(unsignedWord).toBe(0xaabbcc00);
				expect(wordArray.sigBytes).toBe(3);
			});

			it('should handle empty buffer', () => {
				const data = new Uint8Array([]);

				const wordArray = arrayBufferToWordArray(data);

				expect(wordArray.words.length).toBe(0);
				expect(wordArray.sigBytes).toBe(0);
			});
		});

		describe('wordArrayToArrayBuffer', () => {
			it('should correctly convert a WordArray to a Uint8Array', () => {
				const words = [0x11223344];
				const wordArray = CryptoJS.lib.WordArray.create(words, 4);

				const result = wordArrayToArrayBuffer(wordArray);

				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(4);
				expect(Array.from(result)).toEqual([0x11, 0x22, 0x33, 0x44]);
			});

			it('should respect sigBytes when the last word is partial', () => {
				const words = [0x11223344, 0x55667788];
				const wordArray = CryptoJS.lib.WordArray.create(words, 6);

				const result = wordArrayToArrayBuffer(wordArray);

				expect(result.length).toBe(6);
				expect(Array.from(result)).toEqual([0x11, 0x22, 0x33, 0x44, 0x55, 0x66]);
			});

			it('should handle high-bit (negative) signed integers correctly', () => {
				const words = [0xaabbccdd >>> 0];
				const wordArray = CryptoJS.lib.WordArray.create(words, 4);
				const result = wordArrayToArrayBuffer(wordArray);
				expect(Array.from(result)).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
			});

			it('should return an empty Uint8Array for an empty WordArray', () => {
				const wordArray = CryptoJS.lib.WordArray.create([], 0);
				const result = wordArrayToArrayBuffer(wordArray);

				expect(result.length).toBe(0);
				expect(result).toBeInstanceOf(Uint8Array);
			});
		});

		describe('functions are symmetrical', () => {
			[[], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0x80], [0xff, 0xff, 0xff, 0xff]].forEach(
				(input, idx) => {
					it(`should not mangle example #${idx}`, () => {
						const given = new Uint8Array(input);
						const actual = wordArrayToArrayBuffer(arrayBufferToWordArray(given));
						expect(actual).to.deep.equal(given);
					});
				}
			);
		});
	});
});
