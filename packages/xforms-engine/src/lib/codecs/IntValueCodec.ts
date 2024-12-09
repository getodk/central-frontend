import { ValueTypeInvariantError } from '../../error/ValueTypeInvariantError.ts';
import { ValueCodec } from './ValueCodec.ts';

/**
 * Per {@link https://getodk.github.io/xforms-spec/#data-type:int}, which
 * specifies "as in {@link https://www.w3.org/TR/xmlschema-2/#int | XML 1.0}":
 *
 * > int is ·derived· from long by setting the value of ·maxInclusive· to be
 * > 2147483647 and ·minInclusive· to be -2147483648.
 */
const INT_BOUNDS = {
	MIN: -2_147_483_648n,
	MAX: 2_147_483_647n,
};

const assertIntBounds = <T extends bigint | null>(value: T): T => {
	if (value == null) {
		return value;
	}

	if (value < INT_BOUNDS.MIN || value > INT_BOUNDS.MAX) {
		throw new ValueTypeInvariantError(
			'int',
			`Unable to decode int value from ${JSON.stringify(value)}: expected value to be between ${INT_BOUNDS.MIN} and ${INT_BOUNDS.MAX} (inclusive)`
		);
	}

	return value;
};

const boundedInt = (value: bigint | number): bigint => {
	const result = BigInt(value);

	assertIntBounds(result);

	return result;
};

export type IntInputValue = bigint | number | string | null;

const numberToInt = (value: number): bigint | null => {
	if (!Number.isFinite(value)) {
		return null;
	}

	return boundedInt(Math.trunc(value));
};

const encodeInt = (value: IntInputValue): string => {
	let intValue: bigint | null;

	switch (typeof value) {
		case 'object':
			value satisfies null;
			intValue = null;
			break;

		case 'number':
			intValue = numberToInt(value);
			break;

		case 'string':
			intValue = decodeInt(value);
			break;

		default:
			value satisfies bigint;

			intValue = boundedInt(value);
	}

	if (intValue == null) {
		return '';
	}

	return String(intValue);
};

export type IntRuntimeValue = bigint | null;

/**
 * Note: Collect/JavaRosa trim decimal values (i.e. round closest to zero). We
 * do the same.
 *
 * @todo Note that we enforce bounds **after** rounding, which may not be quite
 * right! Look at actual Collect/JR implementation to align.
 */
const decodeInt = (value: string): IntRuntimeValue => {
	if (value === '') {
		return null;
	}

	return numberToInt(Number(value));
};

export class IntValueCodec extends ValueCodec<'int', IntRuntimeValue, IntInputValue> {
	constructor() {
		super('int', encodeInt, decodeInt);
	}
}
