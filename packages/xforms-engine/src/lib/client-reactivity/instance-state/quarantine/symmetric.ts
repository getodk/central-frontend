/**
 * WARNING: DO NOT USE
 *
 * More info: README.md
 */
import { getBlobData } from '@getodk/common/lib/web-compat/blob.ts';
import * as CryptoJS from 'crypto-js';
import { ENCRYPTED_SUBMISSION_ATTACHMENT_NAME, ENCRYPTED_SUFFIX } from './encryption';
import { arrayBufferToWordArray, wordArrayToArrayBuffer } from './wordArrayUtils';

class Seed {
	readonly ivSeedArray;
	private counter = 0;

	public constructor(
		readonly instanceId: string,
		readonly symmetricKey: CryptoJS.lib.WordArray
	) {
		const md = CryptoJS.algo.MD5.create();
		md.update(instanceId);
		md.update(symmetricKey);
		this.ivSeedArray = wordArrayToArrayBuffer(md.finalize());
	}

	next(): string {
		++this.ivSeedArray[this.counter % this.ivSeedArray.length]!;
		++this.counter;
		return String.fromCharCode(...new Uint8Array(this.ivSeedArray));
	}
}

const encryptContent = (
	content: CryptoJS.lib.WordArray | string,
	symmetricKey: CryptoJS.lib.WordArray,
	seed: Seed
): Uint8Array<ArrayBuffer> => {
	const ivString = seed.next();
	const iv = CryptoJS.enc.Latin1.parse(ivString);
	const encrypted = CryptoJS.AES.encrypt(content, symmetricKey, {
		iv: iv,
		mode: CryptoJS.mode.CFB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return wordArrayToArrayBuffer(encrypted.ciphertext);
};

const encryptAttachment = async (
	attachment: File,
	symmetricKey: CryptoJS.lib.WordArray,
	seed: Seed
): Promise<File> => {
	const content = await getBlobData(attachment);
	const wordArray = arrayBufferToWordArray(new Uint8Array(content));
	const encrypted = encryptContent(wordArray, symmetricKey, seed);
	return new File([encrypted], attachment.name + ENCRYPTED_SUFFIX, {
		type: 'application/octet-stream',
	});
};

export const encryptAttachments = async (
	instanceXML: string,
	instanceId: string,
	symmetricKey: Uint8Array<ArrayBuffer>,
	attachments: readonly File[]
): Promise<readonly File[]> => {
	const symmetricKeyWords = arrayBufferToWordArray(symmetricKey);
	const seed = new Seed(instanceId, symmetricKeyWords);
	const encryptedAttachments: File[] = [];
	for (const attachment of attachments) {
		const encrypted = await encryptAttachment(attachment, symmetricKeyWords, seed);
		encryptedAttachments.push(encrypted);
	}

	const encrypted: Uint8Array<ArrayBuffer> = encryptContent(instanceXML, symmetricKeyWords, seed);
	const submissionFile = new File([encrypted], ENCRYPTED_SUBMISSION_ATTACHMENT_NAME, {
		type: 'application/octet-stream',
	});
	encryptedAttachments.push(submissionFile);
	return encryptedAttachments;
};
