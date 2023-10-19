import { toIterableIterator } from './common.ts';

type BooleanPredicate<T> = (value: T) => boolean;

export class Reiterable<T> implements Iterable<T> {
	static from<T>(source: Iterable<T> | Iterator<T>): Reiterable<T> {
		return new this(source);
	}

	protected active: IterableIterator<T>;
	protected cache: T[] = [];

	protected constructor(protected source: Iterable<T> | Iterator<T>) {
		this.active = toIterableIterator(source);
	}

	[Symbol.iterator](): Iterator<T> {
		const { cache, active } = this;

		return (function* () {
			yield* cache;

			for (const item of active) {
				cache.push(item);

				yield item;
			}
		})();
	}

	*entries(): IterableIterator<readonly [key: number, value: T]> {
		const iterator = this[Symbol.iterator]();

		let next: IteratorResult<T>;
		let index = 0;

		while (!(next = iterator.next()).done) {
			yield [index++, next.value];
		}
	}

	*keys(): IterableIterator<number> {
		for (const [key] of this.entries()) {
			yield key;
		}
	}

	*values(): IterableIterator<T> {
		for (const [, value] of this.entries()) {
			yield value;
		}
	}

	first(): T | void {
		/**
		 * It would be tempting to do this:
		 *
		 * for (const item of this) {
		 *   return item;
		 * }
		 *
		 * But interrupting iteration as a non-iterator iterable causes all
		 * subsequent reiterations to terminate after the first item!
		 */
		for (const value of this.values()) {
			return value;
		}
	}

	some(predicate: BooleanPredicate<T>) {
		const iterator = this[Symbol.iterator]();

		let result = false;
		let next: IteratorResult<T>;

		while (result === false) {
			next = iterator.next();

			if (next.done) {
				break;
			}

			const { value } = next;

			if (predicate(value)) {
				result = true;
				break;
			}
		}

		return result;
	}
}
