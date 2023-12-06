// TODO: the parser grammar should only accept these whitespace characters also.
const XML_XPATH_WHITESPACE_SUBPATTERN = '[\\x20\\x09\\x0D\\x0A]';
const XML_XPATH_WHITESPACE_PATTERN = new RegExp(XML_XPATH_WHITESPACE_SUBPATTERN, 'g');
const XML_XPATH_LEADING_TRAILING_WHITESPACE_PATTERN = new RegExp(
	`^${XML_XPATH_WHITESPACE_SUBPATTERN}+|${XML_XPATH_WHITESPACE_SUBPATTERN}+$`,
	'g'
);
const XPATH_REPEATING_WHITESPACE_PATTERN = new RegExp(
	`${XML_XPATH_WHITESPACE_SUBPATTERN}{2,}`,
	'g'
);

export const includesXMLXPathWhitespace = (value: string) =>
	XML_XPATH_WHITESPACE_PATTERN.test(value);

export const trimXMLXPathWhitespace = (value: string): string =>
	value.replaceAll(XML_XPATH_LEADING_TRAILING_WHITESPACE_PATTERN, '');

export const normalizeXMLXPathWhitespace = (value: string): string =>
	trimXMLXPathWhitespace(value).replaceAll(XPATH_REPEATING_WHITESPACE_PATTERN, ' ');

interface XMLXPathWhitespaceSeparatedListOptions {
	readonly ignoreEmpty?: boolean;
}

export const xmlXPathWhitespaceSeparatedList = (
	value: string,
	options?: XMLXPathWhitespaceSeparatedListOptions
): readonly string[] => {
	if (options?.ignoreEmpty && value === '') {
		return [];
	}

	return normalizeXMLXPathWhitespace(value).split(XML_XPATH_WHITESPACE_PATTERN);
};
