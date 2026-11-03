import { Temporal } from 'temporal-polyfill';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';
import { ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN } from '@getodk/common/constants/datetime.ts';

export type TimeRuntimeValue = string | null;

export type TimeInputValue =
  | Date
  | Temporal.PlainDateTime
  | Temporal.PlainTime
  | Temporal.ZonedDateTime
  | string
  | null;

const removeMillis = (value: Temporal.PlainTime) => {
  return value.toString({ fractionalSecondDigits: 0 });
};

const validateTimeString = (value: string): TimeRuntimeValue => {
  if (value.endsWith('Z')) {
    value = value.slice(0, -1);
  }
  const match = ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN.exec(value ?? '');
  if (!match?.length) {
    return null;
  }
  const [, timeOnly = ''] = match;
  try {
    // Delegate bounds checking to Temporal
    return removeMillis(Temporal.PlainTime.from(timeOnly));
  } catch {
    return null;
  }
};

const parseZonedDateTimeToString = (value: Temporal.ZonedDateTime): string => {
  if (!value) {
    return '';
  }

  return removeMillis(value.toPlainTime());
};

/**
 * Converts a time-like value ({@link TimeInputValue}) to a strict time string.
 * Honors timezones/offsets if present on the input objects.
 *
 * Offsets and fractional seconds are dropped. The result is "HH:MM:SS".
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
      return removeMillis(value);
    }

    if (value instanceof Temporal.PlainDateTime) {
      return removeMillis(value.toPlainTime());
    }

    if (value instanceof Temporal.ZonedDateTime) {
      return parseZonedDateTimeToString(value);
    }
    return validateTimeString(value) ?? '';
  } catch {
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
