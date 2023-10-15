export type CollectionValues<T> = T extends ArrayLike<infer U>
	? U
	: T extends ReadonlyArray<infer U>
	? U
	: T extends Array<infer U>
	? U
	: T extends ReadonlySet<infer U>
	? U
	: T extends Set<infer U>
	? U
	: // eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends ReadonlyMap<any, infer U>
	? U
	: // eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Map<any, infer U>
	? U
	: never;

/**
 * From https://github.com/sindresorhus/type-fest with the following changes:
 *
 * - Formatting consistency
 * - Removed `export` statements so types can be treated as global
 */

/**
 * Creates a read-only tuple of type `Element` and with the length of `Length`.
 *
 * @private
 * @see `ReadonlyTuple` which is safer because it tests if `Length` is a
 * specific finite number.
 */
type BuildTupleHelper<
	Element,
	Length extends number,
	Rest extends Element[],
> = Rest['length'] extends Length
	? readonly [...Rest] // Terminate with readonly array (aka tuple)
	: BuildTupleHelper<Element, Length, [Element, ...Rest]>;

/**
 * Create a type that represents a read-only tuple of the given type and length.
 *
 * Use-cases:
 * - Declaring fixed-length tuples with a large number of items.
 * - Creating a range union (for example, `0 | 1 | 2 | 3 | 4` from the keys of
 *   such a type) without having to resort to recursive types.
 * - Creating a tuple of coordinates with a static length, for example, length
 *   of 3 for a 3D vector.
 *
 * @example
 * ```
 * import {ReadonlyTuple} from 'type-fest';
 *
 * type FencingTeam = ReadonlyTuple<string, 3>;
 *
 * const guestFencingTeam: FencingTeam = ['Josh', 'Michael', 'Robert'];
 *
 * const homeFencingTeam: FencingTeam = ['George', 'John'];
 * //=> error TS2322: Type string[] is not assignable to type 'FencingTeam'
 *
 * guestFencingTeam.push('Sam');
 * //=> error TS2339: Property 'push' does not exist on type 'FencingTeam'
 * ```
 *
 * @category Utilities
 */
export type ReadonlyTuple<Element, Length extends number> = number extends Length
	? // Because `Length extends number` and `number extends Length`, then
	  // `Length` is not a specific finite number.

	  // It's not fixed length.
	  readonly Element[]
	: // Otherwise it is a fixed length tuple.
	  BuildTupleHelper<Element, Length, []>;

// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type IterableReadonlyTuple<T, Length extends number> = ReadonlyTuple<T, Length> &
	Pick<readonly T[], 'entries' | 'keys' | 'values'>;
