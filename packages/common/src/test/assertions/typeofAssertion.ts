import type { AnyConstructor, AnyFunction } from '../../../types/helpers.d.ts';

/**
 * @see {@link Typeof}
 */
const TYPEOF = typeof ('' as unknown);

/**
 * Used to derive the union of strings produced by a `typeof ...` expression.
 * While this doesn't change frequently:
 *
 * - It has changed twice in recent memory (`"symbol"` and `"bigint"`)
 * - It will likely change in the foreseeable future (`"record"` and `"tuple"`)
 *
 * Deriving this type helps to ensure {@link TypeofType} remains up to date.
 */
type Typeof = typeof TYPEOF;

/**
 * Corresponds to values producing "function" in a `typeof ...` expression.
 *
 * Note that TypeScript will produce {@link Function} when the input type is
 * `unknown`, but will produce a narrower type for some more specific inputs,
 * such as a union between some non-function type and:
 *
 * - One or more specific function signatures, possibly also specifying its
 *   `this` context.
 * - Any class, which may or may not be `abstract`.
 *
 * TypeScript will **also** narrow those cases with {@link typeofAssertion} with
 * this more expanded type, but in many cases it would fail to do so if we only
 * specify {@link Function}.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type TypeofFunction = AnyConstructor | AnyFunction | Function;

/**
 * Corresponds to values producing "object" in a `typeof ...` expression.
 */
type TypeofObject = object | null;

/**
 * While {@link Typeof} can be derived, the type implied by each member of
 * that union cannot. This is a best faith effort to represent the actual
 * types corresponding to each case. By mapping the type, we can use the
 * {@link typeofAssertion} factory to produce accurate derived types with
 * minimal redundancy, and correct any discrepancies in one place as they
 * might arise (noting that both {@link function} and {@link object} are
 * mapped to more complex types than one might assume from their names).
 */
interface TypeofTypes {
	bigint: bigint;
	boolean: boolean;
	function: TypeofFunction;
	number: number;
	object: TypeofObject;
	string: string;
	symbol: symbol;
	undefined: undefined;
}

type TypeofType<T extends Typeof> = TypeofTypes[T];

export type TypeofAssertion<T extends Typeof> = <U>(
	value: U
) => asserts value is Extract<TypeofType<T>, U>;

export const typeofAssertion = <T extends Typeof>(expected: T): TypeofAssertion<T> => {
	return (value) => {
		const actual = typeof value;

		if (actual !== expected) {
			throw new Error(`Expected typeof value to be ${expected}, got ${actual}`);
		}
	};
};
