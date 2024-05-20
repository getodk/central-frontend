import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { CustomInspectable } from '@getodk/common/test/assertions/helpers.ts';
import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import { ComparableAnswer } from './ComparableAnswer.ts';

type ToPrimitiveHint = 'default' | 'number' | 'string';

type UOMValueConstructor<T extends UOMValue> = Pick<typeof UOMValue, keyof typeof UOMValue> &
	(new (unitValue: number) => T);

export abstract class UOMValue implements CustomInspectable {
	static fromAnswer<Instance extends UOMValue>(
		this: UOMValueConstructor<Instance>,
		answer: ComparableAnswer
	): Instance {
		return new this(parseFloat(answer.stringValue));
	}

	declare readonly ['constructor']: UOMValueConstructor<this>;

	abstract readonly uom: string;

	constructor(readonly unitValue: number) {}

	[Symbol.toPrimitive](hint: ToPrimitiveHint = 'default'): number | string {
		const { unitValue } = this;

		switch (hint) {
			case 'string':
				return String(unitValue);

			case 'number':
			case 'default':
				return unitValue;

			default:
				throw new UnreachableError(hint);
		}
	}

	inspectValue(errorTolerance?: number | this): JSONValue {
		const { unitValue, uom } = this;
		const baseResult = `${unitValue} ${uom}`;

		if (errorTolerance == null) {
			return baseResult;
		}

		return `${baseResult} (± ${String(errorTolerance)} ${uom})`;
	}
}

export class ExpectedApproximateUOMAnswer<
	Value extends UOMValue = UOMValue,
> extends ComparableAnswer {
	readonly stringValue: string;

	constructor(
		readonly uomValue: Value,

		/**
		 * Specifies the acceptable difference between the expected value and an
		 * actual value compared in an assertion.
		 *
		 * This is semantically equivalent to the `error` parameter in
		 * {@link https://hamcrest.org/JavaHamcrest/javadoc/1.3/org/hamcrest/number/IsCloseTo.html | Hamcrest's `isCloseTo`}
		 * assertion comparison. It notably differs from the `numDigits` parameter
		 * in
		 * {@link https://vitest.dev/api/expect.html#tobecloseto | Vitest's `toBeCloseTo`},
		 * which is less clear in its precision-of-comparison semantics.
		 *
		 * **PORTING NOTES**
		 *
		 * The intent here is to port JavaRosa tests with `closeTo` calls with high
		 * confidence that they have the same error tolerance (notwithstanding any
		 * potential discrepancy in their respective floating point implementations;
		 * such discrepancies would be unexpected, given both implement IEEE-754).
		 */
		readonly errorTolerance: Value | number
	) {
		super();

		this.stringValue = String(uomValue.unitValue);
	}

	override inspectValue(): JSONValue {
		return this.uomValue.inspectValue(this.errorTolerance);
	}

	/**
	 * @todo Given that several comparisons ported form JavaRosa fail with a
	 * difference exceedingly close to the provided {@link errorTolerance},
	 * consider whether those failures are rooted in this implementation. However,
	 * a quick glance at the
	 * {@link https://github.com/hamcrest/JavaHamcrest/blob/master/hamcrest/src/main/java/org/hamcrest/number/IsCloseTo.java | equivalent Hamcrest logic}
	 * suggests that our logic is basically the same. (And a quick spike to use
	 * the exact same formulation of the same logic produces the same result.)
	 */
	isCloseTo(actual: ComparableAnswer): boolean {
		const actualValue = this.uomValue.constructor.fromAnswer(actual).unitValue;

		if (Number.isNaN(actualValue)) {
			return false;
		}

		const { uomValue, errorTolerance } = this;
		const expectedValue = uomValue.unitValue;

		if (expectedValue === actualValue) {
			return true;
		}

		const difference = Math.abs(actualValue - expectedValue);

		return difference <= Number(errorTolerance);
	}
}

type SquareMeter = number;

class AreaValue extends UOMValue {
	readonly uom = 'm^2';
}

/**
 * @see {@link ExpectedApproximateUOMAnswer.errorTolerance}
 */
export const expectedArea = (
	area: SquareMeter,
	errorTolerance: number
): ExpectedApproximateUOMAnswer => {
	const value = new AreaValue(area);

	return new ExpectedApproximateUOMAnswer(value, errorTolerance);
};

type Meter = number;

class DistanceValue extends UOMValue {
	readonly uom = 'm';
}

/**
 * @see {@link ExpectedApproximateUOMAnswer.errorTolerance}
 */
export const expectedDistance = (
	distance: Meter,
	errorTolerance: number
): ExpectedApproximateUOMAnswer => {
	const value = new DistanceValue(distance);

	return new ExpectedApproximateUOMAnswer(value, errorTolerance);
};

type FractionalDay = number;

class FractioanlDayValue extends UOMValue {
	readonly uom = 'day';
}

export const expectedFractionalDays = (
	fractionalDays: FractionalDay,
	errorTolerance: number
): ExpectedApproximateUOMAnswer => {
	const value = new FractioanlDayValue(fractionalDays);

	return new ExpectedApproximateUOMAnswer(value, errorTolerance);
};
