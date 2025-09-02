export type Base64Decode = (base64: string) => string;

let base64Decode: Base64Decode;

if (typeof atob === 'function') {
	base64Decode = (base64) => {
		const ascii = atob(base64);
		return decodeURIComponent(
			Array.from(ascii)
				.map((char) => {
					return '%' + char.charCodeAt(0).toString(16).padStart(2, '0');
				})
				.join('')
		);
	};
} else {
	base64Decode = (base64) => {
		return Buffer.from(base64, 'base64').toString('utf-8');
	};
}

export { base64Decode };
