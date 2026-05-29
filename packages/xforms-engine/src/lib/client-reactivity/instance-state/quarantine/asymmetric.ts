/**
 * WARNING: DO NOT USE
 *
 * More info: README.md
 */
const ASYMMETRIC_ALGORITHM = 'RSA-OAEP';
const HASH_FUNCTION = 'SHA-256';
const KEY_FORMAT = 'spki';

// Equivalent to "RSA/NONE/OAEPWithSHA256AndMGF1Padding"
const rsaEncrypt = async (symmetricKey: Uint8Array<ArrayBuffer>, publicKey: CryptoKey) => {
	const encrypted = await crypto.subtle.encrypt(
		{ name: ASYMMETRIC_ALGORITHM },
		publicKey,
		symmetricKey
	);
	return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

const generatePublicKey = async (encryptionKey: string) => {
	const binaryKey = atob(encryptionKey);
	const data = new Uint8Array(binaryKey.length);
	for (let i = 0; i < binaryKey.length; i++) {
		data[i] = binaryKey.charCodeAt(i);
	}
	return await crypto.subtle.importKey(
		KEY_FORMAT,
		data,
		{
			name: ASYMMETRIC_ALGORITHM,
			hash: HASH_FUNCTION,
		},
		false,
		['encrypt']
	);
};

export const getEncryptedSymmetricKey = async (
	encryptionKey: string,
	symmetricKey: Uint8Array<ArrayBuffer>
): Promise<string> => {
	const publicKey = await generatePublicKey(encryptionKey);
	return await rsaEncrypt(symmetricKey, publicKey);
};
