/**
 * Potentially useful for simplifying some types, as exposed by TypeScript
 * diagnostics and in-editor documentation.
 */
export type Identity<T> = T;

/**
 * Simplifies complex types like intersections and interface extensions, as
 * exposed by TypeScript diagnostics and in-editor documentation.
 *
 * Warnings:
 *
 * - Simplifications are not applied recursively
 * -
 */
export type Merge<T> = Identity<{
	[K in keyof T]: T[K];
}>;

/**
 * May be used to simplify union types, as exposed by TypeScript diagnostics and
 * in-editor documentation.
 */
export type ExpandUnion<T> = Exclude<T, never>;
