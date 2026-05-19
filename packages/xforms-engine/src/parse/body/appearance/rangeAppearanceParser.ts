import type { ParsedTokenList } from '../../../lib/TokenListParser.ts';
import { TokenListParser } from '../../../lib/TokenListParser.ts';

export const rangeAppearanceParser = new TokenListParser([
	'no-ticks',
	'picker',
	'rating',
	'vertical',
]);

export type RangeAppearanceDefinition = ParsedTokenList<typeof rangeAppearanceParser>;
