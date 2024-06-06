import { TokenListParser, type ParsedTokenList } from '../../lib/TokenListParser.ts';

export const structureElementAppearanceParser = new TokenListParser(['field-list', 'table-list']);

export type StructureElementAppearanceDefinition = ParsedTokenList<
	typeof structureElementAppearanceParser
>;
