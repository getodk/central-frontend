import { TokenListParser, type ParsedTokenList } from '../../lib/TokenListParser.ts';

export const selectAppearanceParser = new TokenListParser(
	[
		// From XLSForm Docs:
		'compact',
		'horizontal',
		'horizontal-compact',
		'label',
		'list-nolabel',
		'minimal',

		// From Collect `Appearances.kt`:
		'columns',
		'columns-1',
		'columns-2',
		'columns-3',
		'columns-4',
		'columns-5',
		// Note: Collect supports arbitrary columns-n. Technically we do too (we parse
		// out any appearance, not just those we know about). But we'll only include
		// types/defaults up to 5.
		'columns-pack',
		'autocomplete',

		// TODO: these are `<select1>` only
		'likert',
		'quick',
		'quickcompact',
		'map',
		// "quick map"
	],
	{
		aliases: [{ fromAlias: 'search', toCanonical: 'autocomplete' }],
	}
);

export type SelectAppearanceDefinition = ParsedTokenList<typeof selectAppearanceParser>;
