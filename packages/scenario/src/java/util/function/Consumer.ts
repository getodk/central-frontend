/**
 * Partial representation of `java.util.function.Consumer`. Differs from Java's
 * interface in that a {@link Consumer} is **not directly callable**. Matches
 * actual usage as ported from JavaRosa.
 */
export class Consumer<T> {
	constructor(readonly fn: (value: T) => void) {}

	accept(value: T): void {
		this.fn(value);
	}
}
