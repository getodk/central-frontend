/**
 * Represents the same declaration from TypeScript's DOM lib, except it is
 * treated as optionally present. This allows us to feature detect its presence
 * without assuming a DOM[-copatible] runtime environment.
 */
// prettier-ignore
// eslint-disable-next-line no-var -- consistency with upstream types
declare var Node:
	| { readonly prototype: Node; new (): Node }
	| undefined;

/**
 * Represents a minimal assumption about the presence of a document global,
 * which is used to support meaningful feature detection of {@link Node}.
 */
// eslint-disable-next-line no-var -- consistency with upstream types
declare var document: object | undefined;

/**
 * As defined by TypeScript's DOM lib.
 */
// prettier-ignore
type XPathNSResolver =
	| ((prefix: string | null) => string | null)
	| {
			lookupNamespaceURI(prefix: string | null): string | null;
		};
