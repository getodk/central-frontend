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

/**
 * Maps an object type to a shallowly-mutable type otherwise of the same shape
 * and type.
 *
 * {@link T} should be a {@link Record}-like object. This type is **NOT
 * SUITABLE** for producing mutable versions of built-in collections like
 * `readonly T[]` -> `T[]` or `ReadonlyMap<T>` -> `Map<T>`.
 */
type ShallowMutable<T extends object> = {
	-readonly [K in keyof T]: T[K];
};
