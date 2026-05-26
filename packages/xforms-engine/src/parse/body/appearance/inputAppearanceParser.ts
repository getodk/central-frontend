import { TokenListParser, type ParsedTokenList } from '../../../lib/TokenListParser.ts';

export const inputAppearanceParser = new TokenListParser([
	'multiline',
	'numbers',
	'url',
	'thousands-sep',

	// date (TODO: data types)
	'no-calendar',
	'month-year',
	'year',
	// date > calendars
	'ethiopian',
	'coptic',
	'islamic',
	'bikram-sambat',
	'myanmar',
	'persian',

	// geo (TODO: data types)
	'placement-map',
	'maps',

	'hidden-answer',
	'new-front',
	'new',
	'front',

	// *?
	'printer', // Note: actual usage uses `printer:...` (like `ex:...`).
	'masked',
]);

export type InputAppearanceDefinition = ParsedTokenList<typeof inputAppearanceParser>;
