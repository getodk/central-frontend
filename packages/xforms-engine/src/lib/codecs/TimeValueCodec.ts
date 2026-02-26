import {
	ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN,
	VALID_OFFSET_VALUE,
} from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';

export type TimeRuntimeValue = string | null;

export type TimeInputValue =
	| Date
	| Temporal.PlainDateTime
	| Temporal.PlainTime
	| Temporal.ZonedDateTime
	| string
	| null;

const validateTimeString = (value: string): TimeRuntimeValue => {
	const match = ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN.exec(value ?? '');
	if (!match?.length) {
		return null;
	}

	const [, timeOnly = '', offset] = match;
	try {
		// Delegate bounds checking to Temporal
		Temporal.PlainTime.from(timeOnly);
	} catch {
		return null;
	}

	return offset && !VALID_OFFSET_VALUE.test(offset) ? null : value;
};

const parseZonedDateTimeToString = (value: Temporal.ZonedDateTime): string => {
	if (!value) {
		return '';
	}

	const MILLISECONDS = 3;
	const time = value.toPlainTime().toString({ fractionalSecondDigits: MILLISECONDS });
	return `${time}${value.offset}`;
};

/**
 * Converts a time-like value ({@link TimeInputValue}) to a strict time string.
 * Honors timezones/offsets if present on the input objects.
 *
 * @param value - The value to convert.
 * @returns A time string or empty string if invalid.
 */
const toTimeString = (value: TimeInputValue): string => {
	if (value == null) {
		return '';
	}

	try {
		if (value instanceof Date) {
			const zonedTime = Temporal.Instant.fromEpochMilliseconds(value.getTime()).toZonedDateTimeISO(
				Temporal.Now.timeZoneId()
			);
			return parseZonedDateTimeToString(zonedTime);
		}

		if (value instanceof Temporal.PlainTime) {
			return value.toString();
		}

		if (value instanceof Temporal.PlainDateTime) {
			return value.toPlainTime().toString();
		}

		if (value instanceof Temporal.ZonedDateTime) {
			return parseZonedDateTimeToString(value);
		}

		return validateTimeString(value) ?? '';
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Error parsing time value:', error);
		return '';
	}
};

export class TimeValueCodec extends ValueCodec<'time', TimeRuntimeValue, TimeInputValue> {
	constructor() {
		const encodeValue: CodecEncoder<TimeInputValue> = (value) => {
			return toTimeString(value);
		};

		const decodeValue: CodecDecoder<TimeRuntimeValue> = (value: string) => {
			return validateTimeString(value);
		};

		super('time', encodeValue, decodeValue);
	}
}
