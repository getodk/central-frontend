/**
 * Corresponds to `java.util.Collections.emptyMap`, likely differs in a variety
 * of ways, but explicitly differs in returning a `ReadonlyMap`.
 */
export const emptyMap = <K, V>(): ReadonlyMap<K, V> => new Map<K, V>();
