import { Temporal } from '@js-temporal/polyfill';
import { EvaluationContext } from '../../context/EvaluationContext.ts';

// TODO: all date/time stuff should be:
//
// 1. ~~Configured by `Evaluator`/`Context` (e.g. to support specifying TZ rather than inferring by user's browser env).~~
// 2. Probably dependency injected for non-function, expression-level, type inference and casting.

export class DateTimeContext {
  protected readonly calendar = new Temporal.Calendar('iso8601');

  protected readonly timeZone: Temporal.TimeZoneProtocol;

  constructor(protected context: EvaluationContext) {
    this.timeZone = context.timeZone;
  }

  now(): Temporal.ZonedDateTime {
    return Temporal.Now.zonedDateTimeISO(this.timeZone);
  }

  protected getLocalDateTimeString(date: Temporal.ZonedDateTime): string {
    const dateTime = date.toPlainDateTime()
      .toString()
      .replace(/(\.\d{3})\d+$/, '$1')
      .replace(/(T\d{2}:\d{2}(:\d{2})?)$/, '$1.000');
    const offset = date.offset;

    return `${dateTime}${offset}`;
  }

  getCurrentLocalDateTimeString(): string {
    return this.getLocalDateTimeString(this.now());
  }

  getDateTime(value: unknown): Temporal.ZonedDateTime {
    if (typeof value === 'number') {
      const date = new Date(value);

      return this.getDateTime(date.toISOString());
    }

    if (typeof value === 'string') {
      if (value.endsWith('Z')) {
        return Temporal.ZonedDateTime.from(value.replace(/Z$/, '[UTC]')).withTimeZone(this.timeZone);
      }

      if (/[-+]\d{2}:\d{2}$/.test(value) || !/^\d{4}/.test(value)) {
        const date = new Date(value);
        const dateTimeString = `${date.toISOString()}[UTC]`;

        return Temporal.ZonedDateTime.from(dateTimeString).withTimeZone(this.timeZone);
      }

      return Temporal.PlainDateTime.from(value).toZonedDateTime(this.timeZone);
    }

    throw `unknown date time input: ${value}`;
  }

  toDateOrDateTimeString(value: Temporal.ZonedDateTime) {
    const dateTimeString = this.getLocalDateTimeString(value);

    return dateTimeString.replace(/T00:00:00(\.0+)?(Z|[+-]\d{2}:\d{2})?$/, '');
  }
}
