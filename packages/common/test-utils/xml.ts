const parser = new DOMParser();

export const xml = (parts: TemplateStringsArray, ...rest: readonly unknown[]): XMLDocument => {
	const source = String.raw(parts, ...rest).trim();

	return parser.parseFromString(source, 'text/xml');
};
