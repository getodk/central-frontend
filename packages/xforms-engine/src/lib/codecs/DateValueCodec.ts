import { ISO_DATE_OR_DATE_TIME_LIKE_PATTERN } from '@getodk/common/constants/datetime.ts';
import { Temporal } from 'temporal-polyfill';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';

export type DatetimeRuntimeValue = Temporal.PlainDate | null;

export type DatetimeInputValue =
  | Date
  | Temporal.PlainDate
  | Temporal.PlainDateTime
  | Temporal.ZonedDateTime
  | string
  | null;

/**
 * Parses a string in the format 'YYYY-MM-DD', 'YYYY-MM-DDTHH:MM:SS', or an ISO datetime with a timezone offset
 * (e.g. the output of now()) into a Temporal.PlainDate. Only the date portion of the input is used — the time
 * and offset are taken in the browser's local time and ignored.
 *
 * @param value - The string to parse.
 * @returns A {@link DatetimeRuntimeValue}
 */
const parseString = (value: string): DatetimeRuntimeValue => {
  if (
    value == null ||
    typeof value !== 'string' ||
    !ISO_DATE_OR_DATE_TIME_LIKE_PATTERN.test(value)
  ) {
    return null;
  }

  try {
    const dateOnly = value.split('T')[0]!;
    return Temporal.PlainDate.from(dateOnly);
  } catch {
    // TODO: should we throw when codec cannot interpret the value?
    return null;
  }
};

/**
 * Converts a date-like value ({@link DatetimeInputValue}) to a 'YYYY-MM-DD' string.
 *
 * @param value - The value to convert.
 * @returns A date string or empty string if invalid.
 */
const toDateString = (value: DatetimeInputValue): string => {
  if (value == null) {
    return '';
  }

  try {
    if (value instanceof Temporal.PlainDate) {
      return value.toString();
    }

    if (value instanceof Temporal.PlainDateTime || value instanceof Temporal.ZonedDateTime) {
      return value.toPlainDate().toString();
    }

    if (value instanceof Date) {
      return Temporal.PlainDate.from({
        year: value.getFullYear(),
        month: value.getMonth() + 1,
        day: value.getDate(),
      }).toString();
    }

    const parsed = parseString(String(value));
    return parsed?.toString() ?? '';
  } catch {
    return '';
  }
};

export class DateValueCodec extends ValueCodec<'date', DatetimeRuntimeValue, DatetimeInputValue> {
  constructor() {
    const encodeValue: CodecEncoder<DatetimeInputValue> = (value) => {
      return toDateString(value);
    };

    const decodeValue: CodecDecoder<DatetimeRuntimeValue> = (value: string) => {
      return parseString(value);
    };

    super('date', encodeValue, decodeValue);
  }
}
