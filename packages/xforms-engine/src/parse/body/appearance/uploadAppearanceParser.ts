import { TokenListParser, type ParsedTokenList } from '../../../lib/TokenListParser.ts';

export const uploadAppearanceParser = new TokenListParser(['annotate', 'draw', 'signature']);

export type UploadAppearanceDefinition = ParsedTokenList<typeof uploadAppearanceParser>;
