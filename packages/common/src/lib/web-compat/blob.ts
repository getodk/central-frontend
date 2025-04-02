import { UnreachableError } from '../error/UnreachableError.ts';

type BlobBehavior =
	| 'BLOB_BEHAVIOR_BROKEN_BY_DESIGN_REJECTION'
	| 'BLOB_BEHAVIOR_BROKEN_BY_DESIGN_TEXT_MISMATCH'
	| 'BLOB_BEHAVIOR_EXPECTED';

const detectBlobBehavior = async (): Promise<BlobBehavior> => {
	try {
		const blob = new Blob(['a']);
		const text = await blob.text();

		if (text === 'a') {
			return 'BLOB_BEHAVIOR_EXPECTED';
		}

		return 'BLOB_BEHAVIOR_BROKEN_BY_DESIGN_TEXT_MISMATCH';
	} catch {
		return 'BLOB_BEHAVIOR_BROKEN_BY_DESIGN_REJECTION';
	}
};

export const BLOB_BEHAVIOR: BlobBehavior = await detectBlobBehavior();

const readBlobData = async (blob: Blob): Promise<ArrayBuffer> => {
	return new Promise<ArrayBuffer>((resolve, reject) => {
		let isDone = false;

		const reader = new FileReader();

		const complete = () => {
			if (isDone) {
				throw new Error('Cannot complete FileReader read twice!');
			}

			isDone = true;

			const { error, result } = reader;

			reader.removeEventListener('error', complete);
			reader.removeEventListener('load', complete);

			if (error != null) {
				reject(error);
			} else if (result instanceof ArrayBuffer) {
				resolve(result);
			} else {
				reject(new Error('Unknown FileReader state'));
			}
		};

		reader.addEventListener('error', complete);
		reader.addEventListener('load', complete);
		reader.readAsArrayBuffer(blob);
	});
};

const readBlobText = async (blob: Blob): Promise<string> => {
	const data = await readBlobData(blob);
	const decoder = new TextDecoder();

	return decoder.decode(data);
};

/**
 * Gets the text content of a {@link Blob} (or {@link File}).
 *
 * Why does this exist when there's a standard way to get the text of a `Blob`
 * (or `File`)? Because
 * {@link https://github.com/jsdom/jsdom/issues/2555 | jsdom} considers it out
 * of spec... to implement the spec.
 */
let getBlobText: (blob: Blob) => Promise<string>;

let getBlobData: (blob: Blob) => Promise<ArrayBuffer>;

if (BLOB_BEHAVIOR === 'BLOB_BEHAVIOR_EXPECTED') {
	getBlobText = (blob) => blob.text();
	getBlobData = (blob) => blob.arrayBuffer();
} else {
	switch (BLOB_BEHAVIOR) {
		case 'BLOB_BEHAVIOR_BROKEN_BY_DESIGN_REJECTION':
			getBlobText = async (blob) => {
				try {
					const result = await blob.text();

					return result;
				} catch {
					return readBlobText(blob);
				}
			};

			getBlobData = async (blob) => {
				try {
					const result = await blob.arrayBuffer();

					return result;
				} catch {
					return readBlobData(blob);
				}
			};

			break;

		case 'BLOB_BEHAVIOR_BROKEN_BY_DESIGN_TEXT_MISMATCH':
			getBlobText = async (blob) => {
				try {
					const result = await readBlobText(blob);

					return result;
				} catch {
					return blob.text();
				}
			};

			getBlobData = async (blob) => {
				try {
					const result = await readBlobData(blob);

					return result;
				} catch {
					return blob.arrayBuffer();
				}
			};

			break;

		default:
			throw new UnreachableError(BLOB_BEHAVIOR);
	}
}

export { getBlobData, getBlobText };
