import { parseXMLDocument } from './lib/dom/xml.ts';

export const xml = (
	parts: TemplateStringsArray,
	...rest: readonly unknown[]
) => {
	const source = String.raw(parts, ...rest).trim();

	return parseXMLDocument(source);
};
