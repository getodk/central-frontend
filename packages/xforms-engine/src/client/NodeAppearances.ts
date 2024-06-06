import type { ParsedTokenList } from '../lib/TokenListParser.ts';
import type { NodeDefinition } from '../model/NodeDefinition.ts';

/**
 * - Provides a means to distinguish between internal and client-facing names
 *   for the same {@link ParsedTokenList} types.
 *
 * - Anticipates some iteration on both parsed ("definition") types and
 *   client-facing node types, which may not happen in tandem.
 */
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeAppearances<Definition extends NodeDefinition<any>> =
	Definition extends {
		readonly bodyElement: {
			readonly appearances:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				infer Appearances extends ParsedTokenList<any>
		};
	}
		? Appearances
		: null;
