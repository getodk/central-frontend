import * as CryptoJS from 'crypto-js';

export const arrayBufferToWordArray = (buffer: Uint8Array<ArrayBuffer>) => {
	const words = [];
	for (let i = 0; i < buffer.length; i += 4) {
		words.push(
			((buffer[i] ?? 0) << 24) |
				((buffer[i + 1] ?? 0) << 16) |
				((buffer[i + 2] ?? 0) << 8) |
				(buffer[i + 3] ?? 0)
		);
	}
	return CryptoJS.lib.WordArray.create(words, buffer.byteLength);
};

export const wordArrayToArrayBuffer = (
	wordArray: CryptoJS.lib.WordArray
): Uint8Array<ArrayBuffer> => {
	const bytes = new Uint8Array(wordArray.sigBytes);
	for (let j = 0; j < wordArray.sigBytes; j++) {
		bytes[j] = (wordArray.words[j >>> 2]! >>> (24 - 8 * (j % 4))) & 0xff;
	}
	return bytes;
};
