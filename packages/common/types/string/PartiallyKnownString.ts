/**
 * Produces a `string` type while preserving autocomplete/autosuggest
 * functionality for a known string (union).
 *
 * @see {@link https://www.totaltypescript.com/tips/create-autocomplete-helper-which-allows-for-arbitrary-values}
 *
 * @example
 * ```ts
 * let foo: PartiallyKnownString<'a' | 'b' | 'zed'>;
 *
 * // Each of these will be suggested by a TypeScript-supporting editor:
 * foo = 'a';
 * foo = 'b';
 * foo = 'zed';
 *
 * // ... but any string is valid:
 * foo = 'lmnop';
 * ```
 */
// prettier-ignore
export type PartiallyKnownString<Known extends string> =
	[string] extends [Known]
		? string
		: (
				| Known
				| (string & { /* Type hack! */ })
			);
