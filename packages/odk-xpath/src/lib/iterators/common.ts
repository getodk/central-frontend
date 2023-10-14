type Iter<T> =
  | Iterable<T>
  | Iterator<T>
  ;

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

export const map = <T, U>(fn: MapIterated<T, U>): MapIterable<T, U> => (
	function* map(iterable) {
		for (const item of toIterableIterator(iterable)) {
			yield fn(item);
		}
	}
);

export const eager = <T>(iterable: Iter<T>): IterableIterator<T> => (
	Array.from(toIterableIterator(iterable)).values()
);

type TypedGuardIterated<T, U extends T> = (value: T) => value is U;
type PredicateGuardIterated<T> = (value: T) => boolean;

type GuardIterated<T, U extends T> =
	| PredicateGuardIterated<T & U>
	| TypedGuardIterated<T, U>
	;

type UnguardedIterated<Guard extends GuardIterated<any, any>> =
	Guard extends TypedGuardIterated<infer T, any>
		? T
	: Guard extends PredicateGuardIterated<infer T>
		? T
		: never;

type GuardedIterated<Guard extends GuardIterated<any, any>> =
	Guard extends TypedGuardIterated<infer T, infer U>
		? T & U
	: Guard extends PredicateGuardIterated<infer T>
		? T
		: never;

type FilterIterable<
	Guard extends GuardIterated<any, any>
> = MapIterable<UnguardedIterated<Guard>, GuardedIterated<Guard>>;

export const filter = <
	Guard extends GuardIterated<any, any>
>(
	guard: Guard
): FilterIterable<Guard> => (
	function* filter(iterable: Iter<UnguardedIterated<Guard>>): IterableIterator<GuardedIterated<Guard>> {
		for (const item of toIterableIterator(iterable)) {
			if (guard(item)) {
				// @ts-expect-error - this cast doesn't *feel* like it should be necessary!
				yield item/*  as GuardedIterated<Guard> */;
			}
		}
	}
);

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

export const take = <T>(n: number): MapIterable<T, T> => (
	function* take(iterable) {
		let i = 0;

		for (const item of toIterableIterator(iterable)) {
			yield item;

			i += 1;

			if (i === n) {
				break;
			}
		}
	}
);

type UnaryFunction<Value = any, Return = any> = (value: Value) => Return;

type UnaryParameter<T> =
	T extends UnaryFunction<infer Parameter, any>
		? Parameter
		: never;

type UnaryReturn<T> =
	T extends UnaryFunction<any, infer Return>
		? Return
		: never;

type Piped<Fns> =
	Fns extends readonly [UnaryFunction]
		? Fns
	: Fns extends readonly [infer Head, infer Next, ...infer Rest]
		? Head extends UnaryFunction<any, infer T>
			? Next extends UnaryFunction<T, any>
				? readonly [Head, ...Piped<readonly [Next, ...Rest]>]
				: readonly [Head, never, ...Rest]
			: readonly [Head, never, ...Rest]
		: readonly never[];

type Head<T> = T extends readonly [infer U, ...any[]]
		? U
		: never;

type PipeableParameter<Fns> = UnaryParameter<Head<Fns>>;

type Last<T> = T extends readonly [...any[], infer U]
		? U
		: never;

type PipeableReturn<Fns> = UnaryReturn<Last<Fns>>;

export const pipe = <const Fns extends readonly UnaryFunction[]>(
	...fns: Piped<Fns>
) => {
	return (arg: PipeableParameter<Piped<Fns>>): PipeableReturn<Piped<Fns>> => {
		return fns.reduce(
			(acc, cur) => (cur as UnaryFunction)(acc),
			arg
		) as PipeableReturn<Piped<Fns>>;
	};
};
