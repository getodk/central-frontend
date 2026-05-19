/**
 * Minimal subset of
 * {@link https://docs.oracle.com/javase/8/docs/api/java/util/List.html | `java.util.List`}
 * necessary to support calls from ported JavaRosa `Scenario` tests.
 */
interface List<T> {
	get(index: number): T | null;
	isEmpty(): boolean;
	size(): number;
}

export type { List as JavaUtilList };
