import { DateTime } from 'luxon';

import { formatDate, formatDateTime, formatTime } from '../../src/util/date-time';
import { setLuxon } from '../util/date-time';

// Array of test cases
const cases = [
  // Earlier today
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T00:00:00Z',
    formattedDate: ['2018/01/01', 'today'],
    formattedTime: ['00:00']
  },
  // The value is the exact same time as the current time.
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T01:00:00Z',
    formattedDate: ['2018/01/01', 'today'],
    formattedTime: ['01:00']
  },
  // Later today
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T02:00:00Z',
    formattedDate: ['2018/01/01', 'today'],
    formattedTime: ['02:00']
  },
  // Yesterday
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-31T01:00:00Z',
    formattedDate: ['2017/12/31', 'yesterday'],
    formattedTime: ['01:00']
  },
  // More than 24 hours in the past, but still yesterday
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2017-12-31T00:00:00Z',
    formattedDate: ['2017/12/31', 'yesterday'],
    formattedTime: ['00:00']
  },
  // 2 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-30T00:00:00Z',
    formattedDate: ['2017/12/30', 'Saturday'],
    formattedTime: ['00:00']
  },
  // 3 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-29T00:00:00Z',
    formattedDate: ['2017/12/29', 'Friday'],
    formattedTime: ['00:00']
  },
  // 4 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-28T00:00:00Z',
    formattedDate: ['2017/12/28', 'Thursday'],
    formattedTime: ['00:00']
  },
  // 5 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-27T00:00:00Z',
    formattedDate: ['2017/12/27', 'Wednesday'],
    formattedTime: ['00:00']
  },
  // 6 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-26T00:00:00Z',
    formattedDate: ['2017/12/26'],
    formattedTime: ['00:00']
  },
  // Tomorrow
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2018-01-02T00:00:00Z',
    formattedDate: ['2018/01/02'],
    formattedTime: ['00:00']
  },
  // With seconds
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2018-01-01T01:02:59Z',
    formattedDate: ['2018/01/01', 'today'],
    formattedTime: ['01:02', '59']
  },
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2018-01-01T23:59:59Z',
    formattedDate: ['2018/01/01', 'today'],
    formattedTime: ['23:59', '59']
  },
  // The formatted value is in the specified time zone.
  {
    zoneName: 'UTC-1',
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T02:00:00Z',
    formattedDate: ['2018/01/01', 'today'],
    formattedTime: ['01:00']
  },
  {
    zoneName: 'UTC-1',
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-02T00:00:00-02:00',
    formattedDate: ['2018/01/02'],
    formattedTime: ['01:00']
  },
  // Within UTC, the value is the same date as the current time, but within the
  // specified time zone, it is a different date.
  {
    zoneName: 'UTC-1',
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T00:00:00Z',
    formattedDate: ['2017/12/31', 'yesterday'],
    formattedTime: ['23:00']
  },
  // Within UTC, the value is a different date from the current time, but within
  // the specified time zone, it is the same date.
  {
    zoneName: 'UTC-1',
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-02T00:00:00Z',
    formattedDate: ['2018/01/01', 'today'],
    formattedTime: ['23:00']
  }
];

describe('util/date-time', () => {
  let restoreLocale;
  before(() => {
    restoreLocale = setLuxon({ defaultLocale: 'en' });
  });
  after(() => {
    restoreLocale();
  });

  for (const testCase of cases) {
    const { zoneName = 'UTC', now, iso, formattedDate, formattedTime } = testCase;
    const [absoluteDate, relativeDate = absoluteDate] = formattedDate;
    const [hm, s = '00'] = formattedTime;
    const hms = `${hm}:${s}`;

    describe(`formatting '${iso}' when it is now '${now}' (${zoneName})`, () => {
      let restoreLuxon;
      let dateTime;
      before(() => {
        restoreLuxon = setLuxon({ defaultZoneName: zoneName, now });
        dateTime = DateTime.fromISO(iso);
      });
      after(() => {
        restoreLuxon();
      });

      describe('formatDate()', () => {
        it('returns the correct absolute date', () => {
          formatDate(dateTime, false).should.equal(absoluteDate);
          formatDate(dateTime).should.equal(absoluteDate);
        });

        it('returns the correct relative date', () => {
          formatDate(dateTime, true).should.equal(relativeDate);
        });
      });

      describe('formatTime()', () => {
        it('returns the correct hour and minute', () => {
          formatTime(dateTime, false).should.equal(hm);
        });

        it('returns the correct second', () => {
          formatTime(dateTime, true).should.equal(hms);
          formatTime(dateTime).should.equal(hms);
        });
      });

      describe('formatDateTime()', () => {
        it('returns the correct absolute date/time', () => {
          const expected = `${absoluteDate} ${hms}`;
          formatDateTime(dateTime, false).should.equal(expected);
          formatDateTime(dateTime).should.equal(expected);
        });

        it('returns the correct relative date/time', () => {
          formatDateTime(dateTime, true).should.equal(`${relativeDate} ${hm}`);
        });
      });
    });
  }

  describe('invalid DateTime', () => {
    const dateTime = DateTime.fromISO('invalid');

    specify('formatDate() returns the correct string', () => {
      formatDate(dateTime, false).should.equal('Invalid DateTime');
      formatDate(dateTime, true).should.equal('Invalid DateTime');
    });

    specify('formatTime() returns the correct string', () => {
      formatTime(dateTime, true).should.equal('Invalid DateTime');
      formatTime(dateTime, false).should.equal('Invalid DateTime');
    });

    specify('formatDateTime() returns the correct string', () => {
      formatDateTime(dateTime, false).should.equal('Invalid DateTime');
      formatDateTime(dateTime, true).should.equal('Invalid DateTime');
    });
  });
});
