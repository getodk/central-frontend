import type { Blob as NodeBlob } from 'node:buffer';
import type { URL as NodeURL } from 'node:url';

export type ObjectURL = `blob:${string}`;
export type CreateObjectURL = (object: Blob | MediaSource) => ObjectURL;
export type RevokeObjectURL = (url: ObjectURL) => void;

interface NodeFallbacks {
	readonly Blob: typeof NodeBlob;
	readonly URL: typeof NodeURL;
}

const importNodeFallbacks = async (): Promise<NodeFallbacks> => {
	const [{ Blob }, { URL }] = await Promise.all([import('node:buffer'), import('node:url')]);

	return { Blob, URL };
};

let createObjectURL: CreateObjectURL;
let revokeObjectURL: RevokeObjectURL;

if (typeof URL.createObjectURL === 'function') {
	createObjectURL = (object) => {
		return URL.createObjectURL(object) satisfies string as ObjectURL;
	};
} else {
	try {
		const { Blob, URL } = await importNodeFallbacks();

		/**
		 * We're fibbing to `@types/node`, because `@types/node` is fibbing to us!
		 */
		type ObjectURLInput = Blob & NodeBlob;

		/** @see {@link ObjectURLInput} */
		type AssertNodeObjectURLInput = (
			value: Blob | MediaSource | NodeBlob
		) => asserts value is ObjectURLInput;

		/** @see {@link ObjectURLInput} */
		const assertNodeObjectURLInput: AssertNodeObjectURLInput = (value) => {
			if (
				value instanceof Blob ||
				/** @see {@link ObjectURLInput} */
				value instanceof globalThis.Blob
			) {
				return;
			}

			throw new Error('Expected to create object URL from Blob');
		};

		createObjectURL = (object) => {
			assertNodeObjectURLInput(object);

			try {
				return URL.createObjectURL(object) satisfies string as ObjectURL;
			} catch {
				if (object instanceof File) {
					// eslint-disable-next-line no-console
					console.warn(
						'TODO: Creating object URL from File, which was not recognized as a Blob. This is likely to occur in a `jsdom` environment. The actual `Blob` object being constructed will probably be corrupt. Proceed with caution!'
					);
				}

				const blob = new Blob([object]);

				assertNodeObjectURLInput(blob);

				return createObjectURL(blob);
			}
		};
	} catch {
		createObjectURL = () => {
			throw new Error('Platform error: failed to implement `createObjectURL`');
		};
	}
}

if (typeof URL.revokeObjectURL === 'function') {
	revokeObjectURL = (url) => URL.revokeObjectURL(url);
} else {
	const { URL } = await importNodeFallbacks();

	revokeObjectURL = (url) => URL.revokeObjectURL(url);
}

export { createObjectURL, revokeObjectURL };
