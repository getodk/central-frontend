export type UnknownObject = Readonly<Record<PropertyKey, unknown>>;

/**
 * Checks whether a value's type is `'object'`, and the value is not `null`.
 * This is useful as a precondition for more specific type-narrowing predicate
 * and/or assertion functions, allowing inspection of arbitrary properties on
 * {@link value} without verbose/error prone inline type assertions.
 */
export const isUnknownObject = (value: unknown): value is UnknownObject => {
	return typeof value === 'object' && value != null;
};
