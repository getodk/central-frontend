import { Temporal } from 'temporal-polyfill';

export const currentLocalDateTimeString = (timeZone: Temporal.TimeZoneLike): string => {
  return localDateTimeString(now(timeZone));
};

// TODO hopefully we can kill this hack?
export const localDateTimeString = (dateTime: Temporal.ZonedDateTime): string => {
  const resultDateTime = dateTime
    .toPlainDateTime()
    .toString()
    .replace(/(\.\d{3})\d+$/, '$1')
    .replace(/(T\d{2}:\d{2}(:\d{2})?)$/, '$1.000');

  return `${resultDateTime}${dateTime.offset}`;
};

// TODO hopefully we can kill this hack?
export const localDateTimeOrDateString = (dateTime: Temporal.ZonedDateTime): string => {
  const dateTimeString = localDateTimeString(dateTime);

  return dateTimeString.replace(/T00:00:00(\.0+)?(Z|[-+]\d{2}:\d{2})?/, '');
};

export const now = (timeZone: Temporal.TimeZoneLike): Temporal.ZonedDateTime =>
  Temporal.Now.zonedDateTimeISO(timeZone);
