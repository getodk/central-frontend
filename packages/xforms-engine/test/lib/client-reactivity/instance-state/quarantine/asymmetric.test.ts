import { beforeAll, describe, expect, it } from 'vitest';
import { getEncryptedSymmetricKey } from '../../../../../src/lib/client-reactivity/instance-state/quarantine/asymmetric';

describe('asymmetric encryption', () => {
	let publicKeyBase64: string;
	let privateKey: CryptoKey;

	const symmetricKey = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);

	beforeAll(async () => {
		const keyPair = await crypto.subtle.generateKey(
			{
				name: 'RSA-OAEP',
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-256',
			},
			true,
			['encrypt', 'decrypt']
		);

		const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey);
		publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
		privateKey = keyPair.privateKey;
	});

	it('should return a valid base64 encrypted string', async () => {
		const actual = await getEncryptedSymmetricKey(publicKeyBase64, symmetricKey);

		expect(typeof actual).toBe('string');
		expect(actual.length).toBeGreaterThan(0);
		expect(() => atob(actual)).not.toThrow();
	});

	// ensures attacker cannot figure out what the plaintext is by looking up known encrypted submissions
	// See:
	// - https://en.wikipedia.org/wiki/Optimal_asymmetric_encryption_padding
	// - https://en.wikipedia.org/wiki/Probabilistic_encryption
	it('should produce different ciphertexts for the same input', async () => {
		const result1 = await getEncryptedSymmetricKey(publicKeyBase64, symmetricKey);
		const result2 = await getEncryptedSymmetricKey(publicKeyBase64, symmetricKey);
		expect(result1).not.toBe(result2);
	});

	it('should be decryptable by the corresponding private key', async () => {
		const actual = await getEncryptedSymmetricKey(publicKeyBase64, symmetricKey);
		const encryptedBuffer = Uint8Array.from(atob(actual), (c) => c.charCodeAt(0));

		const decryptedBuffer = await crypto.subtle.decrypt(
			{ name: 'RSA-OAEP' },
			privateKey,
			encryptedBuffer
		);

		expect(new Uint8Array(decryptedBuffer)).toEqual(symmetricKey);
	});
});
