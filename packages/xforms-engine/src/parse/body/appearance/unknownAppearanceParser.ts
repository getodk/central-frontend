import { TokenListParser, type ParsedTokenList } from '../../../lib/TokenListParser.ts';

export const unknownAppearanceParser = new TokenListParser();

export type UnknownAppearanceDefinition = ParsedTokenList<typeof unknownAppearanceParser>;
