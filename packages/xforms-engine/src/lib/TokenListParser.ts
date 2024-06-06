import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';

type SymbolIterator = typeof Symbol.iterator;

type TokenListKey<CanonicalToken extends string> =
	| PartiallyKnownString<CanonicalToken>
	| SymbolIterator;

type TokenListIterator<CanonicalToken extends string> = IterableIterator<
	PartiallyKnownString<CanonicalToken>
>;

/**
 * @see {@link TokenListParser}
 */
// prettier-ignore
export type TokenList<CanonicalToken extends string = string> = {
	readonly [Key in TokenListKey<CanonicalToken>]:
		Key extends SymbolIterator
			? () => TokenListIterator<CanonicalToken>
			: boolean;
};

interface TokenListAlias<CanonicalToken extends string> {
	readonly fromAlias: string;
	readonly toCanonical: CanonicalToken;
}

type TokenAliases<CanonicalToken extends string> = ReadonlyArray<TokenListAlias<CanonicalToken>>;

interface TokenListParserOptions<CanonicalToken extends string> {
	readonly aliases?: TokenAliases<CanonicalToken>;
}

type TokenListAttributeName = PartiallyKnownString<'appearance' | 'class'>;

/**
 * Intended primarily for use in parsing these features:
 *
 * - {@link https://getodk.github.io/xforms-spec/#appearances | appearances} ({@link https://xlsform.org/en/#appearance | additional documentation})
 *
 * - {@link https://getodk.github.io/xforms-spec/#body-attributes | body `class` attribute}
 *
 * This class is named as a reference to {@link DOMTokenList}
 * ({@link https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList | MDN}),
 * with these similarities:
 *
 * - Represents a value whose serialization is a space-separated list.
 * - Each member ("token") is a string (without whitespace).
 * - Provides set-like semantics to determine presence of members.
 * - Provides ordering semantics as determined by the serialization.
 *
 * This class differs from that prior art in that:
 *
 * - It provides a notion of "canonical" members. This is _mostly_ (but not
 *   entirely) intended as a convenience to client developers, automatically
 *   populating canonical/known tokens for a given parser type in
 *   editor-provided autocomplete, etc. **Importantly**, non-canonical tokens
 *   _are not ignored_ in either the {@link TokenList}'s types or runtime
 *   values.
 *
 * - Provided "canonical" members may also be used to specify
 *   {@link TokenListParserOptions.aliases | optional aliases}. (Example: when
 *   parsing "appearances", an alias might map an older deprecated appearance to
 *   a newer canonical equivalent.) **Importantly**, when a token matches an
 *   alias, both that alias _and the token as-specified_ will be present in the
 *   produced {@link TokenList}.
 *
 * - As a parser, it is intended to be read-only. The serialized format which it
 *   parses is _generally_ the source of truth (excepting e.g. aliases).
 *   Notably, and as mentioned above, ordering is determined by:
 *
 *     - Iterating each member, as provided by the serialized representation
 *
 *     - If that member corresponds to an alias, that alias is yielded first
 *
 *     - Regardless of whether the member corresponds to an alias, the member is
 *       yielded as-specified
 *
 * - A parsed {@link TokenList} is intended to maximize convenience of read-only
 *   access. Despite many _conceptual similarities_, most of the
 *   {@link DOMTokenList} **interface** is eschewed in favor of two (mutually
 *   equivalent) access mechanisms:
 *
 *     - `Iterable<Token>`, with the ordering semantics described above
 *     - `Record<Token, boolean>`
 *
 * \* This may change, as we refine requirements. In the future, we may
 * introduce a notion of mutually exclusive tokens (e.g. "appearances" which
 * cannot be used together), which may in turn utilize instance-defined ordering
 * as part of that mechanism.
 */
export class TokenListParser<
	CanonicalToken extends string,
	// Note: this is a separate type parameter so that specifying an alias does
	// not cause it to be mistakenly inferred as a `CanonicalToken` which was
	// not otherwise specified.
	TokenAlias extends CanonicalToken = CanonicalToken,
> {
	private readonly aliases: ReadonlyMap<string, CanonicalToken>;

	constructor(
		readonly canonicalTokens: readonly CanonicalToken[],
		options?: TokenListParserOptions<TokenAlias>
	) {
		this.aliases = new Map(
			(options?.aliases ?? []).map(({ fromAlias, toCanonical }) => {
				return [fromAlias, toCanonical];
			})
		);
	}

	parseFrom(element: Element, attributeName: TokenListAttributeName): TokenList<CanonicalToken> {
		const serialized = element.getAttribute(attributeName) ?? '';
		const specified = xmlXPathWhitespaceSeparatedList(serialized, {
			ignoreEmpty: true,
		});
		const { aliases } = this;
		const resolved = specified.flatMap((token) => {
			const alias = aliases.get(token);

			if (alias == null) {
				return token;
			}

			return [alias, token];
		});
		const tokens = new Set(resolved);

		return new Proxy(
			{
				[Symbol.iterator]() {
					return resolved.values();
				},
			} satisfies TokenList<string> as TokenList<CanonicalToken>,
			{
				get(target, property, receiver) {
					if (typeof property === 'symbol') {
						return Reflect.get(target, property, receiver);
					}

					return tokens.has(property);
				},

				set() {
					return false;
				},
			}
		);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParsedTokenList<Parser extends TokenListParser<any>> =
	Parser extends TokenListParser<infer CanonicalToken> ? TokenList<CanonicalToken> : never;
