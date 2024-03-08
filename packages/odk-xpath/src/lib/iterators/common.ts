import { tee as baseTee } from 'itertools-ts/lib/transform';

type Iter<T> = Iterable<T> | Iterator<T>;

function isIterable<T>(iter: Iterator<T>): iter is IterableIterator<T>;
function isIterable<T>(iter: Iter<T>): iter is Iterable<T>;
function isIterable<T>(iter: Iter<T>): iter is Iterable<T> {
	return typeof (iter as Partial<Iterable<T>>)[Symbol.iterator] === 'function';
}

export function* toIterableIterator<T>(iter: Iter<T>): IterableIterator<T> {
	if (isIterable(iter)) {
		yield* iter;
	} else {
		let next: IteratorResult<T>;

		while (!(next = iter.next()).done) {
			yield next.value;
		}
	}
}

type MapIterated<T, U> = (value: T) => U;

export type MapIterable<T, U> = (iterable: Iter<T>) => IterableIterator<U>;

export const map = <T, U>(fn: MapIterated<T, U>): MapIterable<T, U> =>
	// eslint-disable-next-line @typescript-eslint/no-shadow -- naming the function is helpful in stack traces/debugging
	function* map(iterable) {
		for (const item of toIterableIterator(iterable)) {
			yield fn(item);
		}
	};

export const eager = <T>(iterable: Iter<T>): IterableIterator<T> =>
	Array.from(toIterableIterator(iterable)).values();

type TypedGuardIterated<T, U extends T> = (value: T) => value is U;
type PredicateGuardIterated<T> = (value: T) => boolean;

type GuardIterated<T, U extends T> = PredicateGuardIterated<T & U> | TypedGuardIterated<T, U>;

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnguardedIterated<Guard extends GuardIterated<any, any>> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Guard extends TypedGuardIterated<infer T, any>
		? T
	: Guard extends PredicateGuardIterated<infer T>
		? T
		: never;

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GuardedIterated<Guard extends GuardIterated<any, any>> =
	Guard extends TypedGuardIterated<infer T, infer U>
		? T & U
	: Guard extends PredicateGuardIterated<infer T>
		? T
		: never;

type FilterIterable<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Guard extends GuardIterated<any, any>,
> = MapIterable<UnguardedIterated<Guard>, GuardedIterated<Guard>>;

export const filter = <
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Guard extends GuardIterated<any, any>,
>(
	guard: Guard
): FilterIterable<Guard> =>
	// eslint-disable-next-line @typescript-eslint/no-shadow -- naming the function is helpful in stack traces/debugging
	function* filter(
		iterable: Iter<UnguardedIterated<Guard>>
	): IterableIterator<GuardedIterated<Guard>> {
		for (const item of toIterableIterator(iterable)) {
			if (guard(item)) {
				// @ts-expect-error - this cast doesn't *feel* like it should be necessary!
				yield item /*  as GuardedIterated<Guard> */;
			}
		}
	};

export const distinct = function* distinct<T>(iterable: Iterable<T>) {
	const items = new Set<T>();

	for (const item of iterable) {
		if (!items.has(item)) {
			items.add(item);
			yield item;
		}
	}

	items.clear();
};

type TeeResult<T> = [IterableIterator<T>, IterableIterator<T>];

export const tee = <T>(input: Iterable<T> | Iterator<T>): TeeResult<T> => {
	return baseTee(input, 2) as [unknown, unknown] as TeeResult<T>;
};
