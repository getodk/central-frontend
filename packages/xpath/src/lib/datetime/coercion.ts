import {
  MILLISECOND_NANOSECONDS,
  TIMEZONE_OFFSET_PATTERN,
  VALID_OFFSET_VALUE,
} from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import { isISODateOrDateTimeLike } from './predicates.ts';

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

  try {
    if (value.endsWith('Z') || TIMEZONE_OFFSET_PATTERN.test(value)) {
      return Temporal.Instant.from(value).toZonedDateTimeISO(timeZone);
    }
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
