import {
  MILLISECOND_NANOSECONDS,
  TIMEZONE_OFFSET_PATTERN,
  VALID_OFFSET_VALUE,
} from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import { isISODateOrDateTimeLike } from './predicates.ts';

const tryParseDateString = (value: string): string | null => {
  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return `${date.toISOString()}[UTC]`;
  } catch {
    // Intentionally ignored, returns `null` on failure
  }

  return null;
};

const hasTimeZone = (value: string) => {
  return value.endsWith('Z') || TIMEZONE_OFFSET_PATTERN.test(value) || !/^\d{4}/.test(value);
};

export const dateTimeFromString = (
  timeZone: Temporal.TimeZoneLike,
  value: string
): Temporal.ZonedDateTime | null => {
  if (!isISODateOrDateTimeLike(value)) {
    return null;
  }

  const offsetMatch = TIMEZONE_OFFSET_PATTERN.exec(value);
  if (offsetMatch != null && !VALID_OFFSET_VALUE.test(offsetMatch[0])) {
    return null;
  }

  const zoned = hasTimeZone(value);
  if (zoned) {
    const parsed = tryParseDateString(value);
    if (!parsed) {
      return null;
    }
    try {
      return Temporal.ZonedDateTime.from(parsed).withTimeZone(timeZone);
    } catch {
      return null;
    }
  }

  try {
    return Temporal.PlainDateTime.from(value).toZonedDateTime(timeZone);
  } catch {
    return null;
  }
};

const toNanoseconds = (milliseconds: number): bigint => {
  // Math.round is required in case milliseconds is a decimal
  return BigInt(Math.round(milliseconds)) * MILLISECOND_NANOSECONDS;
};

export const dateTimeFromNumber = (
  timeZone: Temporal.TimeZoneLike,
  milliseconds: number
): Temporal.ZonedDateTime | null => {
  if (Number.isNaN(milliseconds)) {
    return null;
  }

  return new Temporal.ZonedDateTime(toNanoseconds(milliseconds), timeZone.toString());
};
