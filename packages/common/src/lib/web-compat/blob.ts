/**
 * Gets the text content of a {@link Blob} (or {@link File}).
 *
 * Why does this exist when there's a standard way to get the text of a `Blob`
 * (or `File`)? Because
 * {@link https://github.com/jsdom/jsdom/issues/2555 | jsdom} considers it out
 * of spec... to implement the spec.
 */
let getBlobText: (blob: Blob) => Promise<string>;

const isBlobBrokenByDesign = async (): Promise<boolean> => {
	try {
		const blob = new Blob(['a']);
		const text = await blob.text();

		return text !== 'a';
	} catch {
		return true;
	}
};

if (await isBlobBrokenByDesign()) {
	getBlobText = (blob) => {
		return new Promise((resolve, reject) => {
			let isDone = false;

			const reader = new FileReader();

			const complete = () => {
				if (isDone) {
					throw new Error('Cannot complete FileReader read twice!');
				}

				isDone = true;

				const { error, result } = reader;

				if (typeof result === 'string') {
					resolve(result);
				} else if (error != null) {
					reject(error);
				} else {
					throw new Error('Unknown FileReader state');
				}

				reader.removeEventListener('error', complete);
				reader.removeEventListener('load', complete);
			};

			reader.addEventListener('error', complete);
			reader.addEventListener('load', complete);

			reader.readAsText(blob);
		});
	};
} else {
	getBlobText = (blob) => blob.text();
}

export { getBlobText };
