import { ValueCodec } from './ValueCodec.ts';

export type DecimalInputValue = bigint | number | string | null;

const encodeDecimal = (value: DecimalInputValue): string => {
	if (value == null) {
		return '';
	}

	if (typeof value === 'string') {
		decodeDecimal(value);
	}

	return String(value);
};

export type DecimalRuntimeValue = number | null;

const decodeDecimal = (value: string): DecimalRuntimeValue => {
	if (value === '') {
		return null;
	}

	const decoded = Number(value);

	if (
		// NaN is not a decimal value!
		Number.isNaN(decoded) ||
		// Infinity is not a decimal value!
		!Number.isFinite(decoded)
	) {
		return null;
	}

	return decoded;
};

export class DecimalValueCodec extends ValueCodec<
	'decimal',
	DecimalRuntimeValue,
	DecimalInputValue
> {
	constructor() {
		super('decimal', encodeDecimal, decodeDecimal);
	}
}
