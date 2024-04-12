import { createUniqueId as baseCreateUniqueId } from 'solid-js';

/**
 * **WARNING:** Uniqueness is not guaranteed across multiple sessions. Do not
 * use IDs produced by this function in persistence scenarios, or where external
 * interfaces expect stronger uniqueness guarantees.
 */
export type CreateUniqueId = () => string;

/**
 * Where available, uses the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API | Web Crypto API}'s
 * {@link crypto.randomUUID | `randomUUID`}.
 *
 * Notes on supported environments:
 *
 * - Browsers: only available in a
 *   {@link https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts | secure context}
 * - Node: >= v19.0.0
 * - Deno: >= 1.11
 * - Bun: fully supported, unknown minimum version
 *
 * Where `randomUUID` is not supported, falls back to an internal implementation
 * with weaker uniqueness constraints.
 *
 * **WARNING:** Uniqueness is not guaranteed across multiple sessions. Do not
 * use IDs produced by this function in persistence scenarios, or where external
 * interfaces expect stronger uniqueness guarantees.
 */
export const createUniqueId: CreateUniqueId = (() => {
	const { crypto } = globalThis;

	return crypto?.randomUUID?.bind(crypto) ?? baseCreateUniqueId;
})();
