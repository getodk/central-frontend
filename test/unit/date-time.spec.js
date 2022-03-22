import { DateTime } from 'luxon';

import { formatDate, formatDateTime, formatTime } from '../../src/util/date-time';
import { setLuxon } from '../util/date-time';

const dt = (iso) => DateTime.fromISO(iso);

// Array of test cases
const recentCases = [
  // Earlier today
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T00:00:00Z',
    formatted: 'today'
  },
  // The value is the exact same time as the current time.
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T01:00:00Z',
    formatted: 'today'
  },
  // Later today
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T02:00:00Z',
    formatted: 'today'
  },
  // Yesterday
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-31T01:00:00Z',
    formatted: 'yesterday'
  },
  // More than 24 hours in the past, but still yesterday
  {
    now: '2018-01-01T01:00:00Z',
    iso: '2017-12-31T00:00:00Z',
    formatted: 'yesterday'
  },
  // 2 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-30T00:00:00Z',
    formatted: 'Saturday'
  },
  // 3 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-29T00:00:00Z',
    formatted: 'Friday'
  },
  // 4 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-28T00:00:00Z',
    formatted: 'Thursday'
  },
  // 5 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-27T00:00:00Z',
    formatted: 'Wednesday'
  },
  // 6 days ago
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2017-12-26T00:00:00Z',
    formatted: '2017/12/26'
  },
  // Tomorrow
  {
    now: '2018-01-01T00:00:00Z',
    iso: '2018-01-02T00:00:00Z',
    formatted: '2018/01/02'
  },
  // Within UTC, the value is the same date as the current time, but within the
  // specified time zone, it is a different date.
  {
    defaultZoneName: 'UTC-1',
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-01T00:00:00Z',
    formatted: 'yesterday'
  },
  // Within UTC, the value is a different date from the current time, but within
  // the specified time zone, it is the same date.
  {
    defaultZoneName: 'UTC-1',
    now: '2018-01-01T01:00:00Z',
    iso: '2018-01-02T00:00:00Z',
    formatted: 'today'
  }
];

describe('util/date-time', () => {
  let restoreLuxon;
  afterEach(() => {
    if (restoreLuxon != null) {
      restoreLuxon();
      restoreLuxon = null;
    }
  });

  describe('formatDate()', () => {
    it('returns the correct absolute date', () => {
      restoreLuxon = setLuxon({ defaultZoneName: 'UTC' });
      formatDate(dt('2018-01-01T00:00:00Z')).should.equal('2018/01/01');
    });

    it('returns the date in the correct time zone', () => {
      restoreLuxon = setLuxon({ defaultZoneName: 'UTC-1' });
      formatDate(dt('2018-01-01T00:00:00Z')).should.equal('2017/12/31');
    });

    describe('recent date', () => {
      for (const testCase of recentCases) {
        const { defaultZoneName = 'UTC', now, iso, formatted } = testCase;
        // eslint-disable-next-line no-loop-func
        it(`formats ${iso} when it is now ${now} (${defaultZoneName})`, () => {
          restoreLuxon = setLuxon({ defaultZoneName, now });
          formatDate(dt(iso), 'recent').should.equal(formatted);
        });
      }
    });

    it('returns the correct string for an invalid DateTime', () => {
      formatDate(dt('invalid')).should.equal('Invalid DateTime');
    });
  });

  describe('formatTime()', () => {
    it('returns the correct hour and minute', () => {
      restoreLuxon = setLuxon({ defaultZoneName: 'UTC' });
      formatTime(dt('2018-01-01T01:23:45Z'), false).should.equal('01:23');
      formatTime(dt('2018-01-01T23:45:01Z'), false).should.equal('23:45');
    });

    it('returns the correct second', () => {
      restoreLuxon = setLuxon({ defaultZoneName: 'UTC' });
      const dateTime = dt('2018-01-01T01:23:45Z');
      formatTime(dateTime, true).should.equal('01:23:45');
      formatTime(dateTime).should.equal('01:23:45');
    });

    it('returns the time in the correct time zone', () => {
      restoreLuxon = setLuxon({ defaultZoneName: 'UTC-1' });
      formatTime(dt('2018-01-01T02:00:00Z')).should.equal('01:00:00');
    });

    it('returns the correct string for an invalid DateTime', () => {
      formatTime(dt('invalid')).should.equal('Invalid DateTime');
    });
  });

  describe('formatDateTime()', () => {
    beforeEach(() => {
      restoreLuxon = setLuxon({ defaultZoneName: 'UTC', now: '2018-01-01T00:00:00Z' });
    });

    it('returns the correct absolute date/time', () => {
      const formatted = formatDateTime(dt('2017-12-31T01:23:45Z'));
      formatted.should.equal('2017/12/31 01:23:45');
    });

    it('returns the correct recent date/time', () => {
      const formatted = formatDateTime(dt('2017-12-31T01:23:45Z'), 'recent');
      formatted.should.equal('yesterday 01:23');
    });

    describe('past date/time', () => {
      const cases = [
        // Future
        ['2018-01-01T01:00:00Z', '2018/01/01 01:00:00'],
        // Exact same time as the current time
        ['2018-01-01T00:00:00Z', '2018/01/01 00:00:00'],
        ['2017-12-31T23:59:00Z', '60 sec. ago'],
        ['2017-12-31T23:58:59Z', '1 min. ago'],
        ['2017-12-31T22:00:00Z', '120 min. ago'],
        ['2017-12-31T21:59:59Z', '2 hr. ago'],
        ['2017-12-30T00:00:00Z', '48 hr. ago'],
        ['2017-12-29T23:59:59Z', '2 days ago'],
        ['2017-11-17T00:00:00Z', '45 days ago'],
        ['2017-11-16T23:59:59Z', '6 wk. ago'],
        ['2017-11-06T00:00:00Z', '8 wk. ago'],
        ['2017-11-05T23:59:59Z', '1 mo. ago'],
        ['2015-01-01T00:00:00Z', '36 mo. ago'],
        ['2014-12-31T23:59:59Z', '3 yr. ago']
      ];
      for (const [iso, formatted] of cases) {
        it(`correctly formats ${iso}`, () => {
          formatDateTime(dt(iso), 'past').should.equal(formatted);
        });
      }
    });

    it('returns the correct string for an invalid DateTime', () => {
      formatDateTime(dt('invalid')).should.equal('Invalid DateTime');
    });
  });
});
