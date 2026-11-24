import {
  DAY_MILLISECONDS,
  FRACTIONAL_SECOND_DIGITS,
  ISO_DATE_TIME_WITH_OPTIONAL_OFFSET_PATTERN,
  TIMEZONE_OFFSET_PATTERN,
  VALID_OFFSET_VALUE,
} from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';

export type DateTimeRuntimeValue = string | null;

export type DateTimeInputValue =
  | Date
  | Temporal.PlainDateTime
  | Temporal.ZonedDateTime
  | string
  | null;

const validateDateTimeString = (value: string): DateTimeRuntimeValue => {
  if (value == null || typeof value !== 'string' || value.length === 0) {
    return null;
  }

  if (Number.isFinite(Number(value))) {
    const millis = Math.round(Number(value) * DAY_MILLISECONDS);
    return formatMillis(millis);
  }

  const match = ISO_DATE_TIME_WITH_OPTIONAL_OFFSET_PATTERN.exec(value);
  if (match == null) {
    return null;
  }

  const offset = match[match.length - 1];
  if (offset != null && !VALID_OFFSET_VALUE.test(offset)) {
    return null;
  }

  try {
    // Delegate bounds checking to Temporal (catches invalid month, day, hour, etc.)
    if (value.endsWith('Z') || TIMEZONE_OFFSET_PATTERN.test(value)) {
      Temporal.Instant.from(value);
    } else {
      Temporal.PlainDateTime.from(value);
    }
    return value;
  } catch {
    return null;
  }
};

const formatZonedDateTime = (zdt: Temporal.ZonedDateTime): string => {
  const date = zdt.toPlainDate().toString();
  const time = zdt.toPlainTime().toString({ fractionalSecondDigits: FRACTIONAL_SECOND_DIGITS });
  return `${date}T${time}${zdt.offset}`;
};

const formatMillis = (millis: number): string => {
  const datetime = Temporal.Instant.fromEpochMilliseconds(millis).toZonedDateTimeISO(
    Temporal.Now.timeZoneId()
  );
  return formatZonedDateTime(datetime);
};

/**
 * Converts a datetime-like value ({@link DateTimeInputValue}) to a datetime string
 * with timezone offset. Honors timezones/offsets if present on the input objects.
 *
 * @param value - The value to convert.
 * @returns A datetime string or empty string if invalid.
 */
const toDateTimeString = (value: DateTimeInputValue): string => {
  if (value == null) {
    return '';
  }

  try {
    if (value instanceof Date) {
      return formatMillis(value.getTime());
    }

    if (value instanceof Temporal.PlainDateTime) {
      return value.toString({ fractionalSecondDigits: FRACTIONAL_SECOND_DIGITS });
    }

    if (value instanceof Temporal.ZonedDateTime) {
      return formatZonedDateTime(value);
    }

    return validateDateTimeString(value) ?? '';
  } catch {
    return '';
  }
};

export class DateTimeValueCodec extends ValueCodec<
  'dateTime',
  DateTimeRuntimeValue,
  DateTimeInputValue
> {
  constructor() {
    const encodeValue: CodecEncoder<DateTimeInputValue> = (value) => {
      return toDateTimeString(value);
    };

    const decodeValue: CodecDecoder<DateTimeRuntimeValue> = (value: string) => {
      return validateDateTimeString(value);
    };

    super('dateTime', encodeValue, decodeValue);
  }
}
