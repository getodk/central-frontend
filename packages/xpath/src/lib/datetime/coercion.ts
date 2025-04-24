import { Temporal } from 'temporal-polyfill';
import {
	MILLISECOND_NANOSECONDS,
	VALID_OFFSET_VALUE,
	TIMEZONE_OFFSET_PATTERN,
} from '@getodk/common/constants/datetime.ts';
import { isISODateOrDateTimeLike } from './predicates.ts';

export const tryParseDateString = (value: string): Date | null => {
	try {
		const date = new Date(value);

		if (Number.isNaN(date.getTime())) {
			return null;
		}

		return date;
	} catch {
		// Intentionally ignored, returns `null` on failure
	}

	return null;
};

export const dateTimeFromString = (
	timeZone: Temporal.TimeZoneLike,
	value: string
): Temporal.ZonedDateTime | null => {
	if (!isISODateOrDateTimeLike(value)) {
		return null;
	}

	if (value.endsWith('Z')) {
		return Temporal.ZonedDateTime.from(value.replace(/Z$/, '[UTC]')).withTimeZone(timeZone);
	}

	const offsetMatch = TIMEZONE_OFFSET_PATTERN.exec(value);
	if (offsetMatch != null && !VALID_OFFSET_VALUE.test(offsetMatch[0])) {
		return null;
	}

	if (TIMEZONE_OFFSET_PATTERN.test(value) || !/^\d{4}/.test(value)) {
		const date = tryParseDateString(value);

		if (date == null) {
			return null;
		}

		const dateTimeString = `${date.toISOString()}[UTC]`;

		return Temporal.ZonedDateTime.from(dateTimeString).withTimeZone(timeZone);
	}

	return Temporal.PlainDateTime.from(value).toZonedDateTime(timeZone);
};

const toNanoseconds = (milliseconds: bigint | number): bigint =>
	BigInt(milliseconds) * MILLISECOND_NANOSECONDS;

export const dateTimeFromNumber = (
	timeZone: Temporal.TimeZoneLike,
	milliseconds: number
): Temporal.ZonedDateTime | null => {
	if (Number.isNaN(milliseconds)) {
		return null;
	}

	return new Temporal.ZonedDateTime(toNanoseconds(milliseconds), timeZone.toString());
};
