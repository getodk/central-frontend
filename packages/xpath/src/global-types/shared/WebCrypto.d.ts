/**
 * @see {@link crypto}
 */
interface Crypto {
	randomUUID(): `${string}-${string}-${string}-${string}-${string}`;
}

/**
 * Represents the same declaration from TypeScript's DOM lib, except both of the
 * following are treated as optionally present:
 *
 * - The object itself, allowing for broad feature detection of a
 *   WebCrypto-compatible API.
 *
 * - The {@link Crypto.randomUUID | `randomUUID`} method itself, which in
 *   browser runtimes is only available in secure contexts. This limitation is
 *   discussed in more detail, accompanying its actual feature detection logic.
 */
// eslint-disable-next-line no-var
declare var crypto: Partial<Crypto> | undefined;
