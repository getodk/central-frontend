/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { DateTime, Settings } from 'luxon';
import { path } from 'ramda';

import { formatDate, formatDateTime, formatTime } from './date-time';

export const getValue = (submission, field) =>
  path(field.pathElements, submission);

export const formatValue = (submission, field, i18n) => {
  const rawValue = getValue(submission, field);
  if (rawValue == null) return null;
  switch (field.type) {
    case 'int':
      return i18n.n(rawValue, 'default');
    // The ODK XForms specification seems to allow decimal values that cannot be
    // precisely stored as a Number. However, Collect limits decimal input to 15
    // characters, resulting in only values that can be precisely stored as a
    // Number.
    case 'decimal': {
      if (Number.isInteger(rawValue)) return i18n.n(rawValue, 'default');
      // Non-integers outside this range are more than 15 characters (including
      // the sign and decimal point).
      if (rawValue >= 10000000000000 || rawValue <= -1000000000000)
        return i18n.n(rawValue, 'maximumFractionDigits1');
      const integerDigits = Math.floor(Math.abs(rawValue)).toString().length;
      const signCharacters = rawValue < 0 ? 1 : 0;
      // 14, not 15, because the decimal point consumes a character.
      const fractionDigits = 14 - integerDigits - signCharacters;
      return i18n.n(rawValue, `maximumFractionDigits${fractionDigits}`);
    }

    // There may be differences between ISO 8601 and the the ODK XForms
    // specification for date or time values, but the values that Collect sends
    // seem to be ISO 8601. Here, we attempt to parse a date or time value as
    // ISO 8601, but if the resulting DateTime is invalid, we indicate that to
    // the user.
    case 'date':
      return formatDate(DateTime.fromISO(rawValue));
    case 'time': {
      /* Collect does not allow the user to select a time value's associated
      time zone. However, Collect may add a time zone designator to the value
      nonetheless. In that case, we will remove the time zone designator before
      displaying the value in the table. By default, DateTime.fromISO() returns
      a local DateTime. However, if the system date is the date of a DST shift,
      rawValue may imply an invalid or ambiguous time: since rawValue includes a
      time but not a date, DateTime will use the system date. To avoid that, we
      temporarily set the default time zone to UTC. */
      const originalZoneName = Settings.defaultZoneName;
      Settings.defaultZoneName = 'utc';
      const time = DateTime.fromISO(rawValue, { setZone: true });
      Settings.defaultZoneName = originalZoneName;
      return formatTime(time);
    }
    // rawValue is an Edm.DateTimeOffset. Again, there may be differences
    // between ISO 8601 and the Edm.DateTimeOffset specification. However,
    // ISO 8601 is the only likely format for rawValue. As with a date or time
    // value, we attempt to parse a dateTime value as ISO 8601, indicating any
    // failure to the user.
    case 'dateTime':
      return formatDateTime(DateTime.fromISO(rawValue));

    default:
      return rawValue;
  }
};
