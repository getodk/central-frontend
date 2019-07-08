import { formatDate } from '../../src/util/util';
import { setLuxon } from '../util/util';

describe('util', () => {
  describe('formatDate()', () => {
    it('formats null as an empty string by default', () => {
      formatDate(null).should.equal('');
    });

    it('formats null according to the second parameter', () => {
      formatDate(null, 'something').should.equal('something');
    });

    /*
    Array of test cases, where each case is an array with the following
    structure:

    [
      default time zone (mocking the system time zone),
      ISO 8601 string to use as the current timestamp (mocking the system time),
      raw value,
      expected formatted value
    ]
    */
    const cases = [
      // Earlier today
      ['UTC', '2018-01-01T01:00:00Z', '2018-01-01T00:00:00Z', 'Today 00:00'],
      // The value is the exact same time as the current time.
      ['UTC', '2018-01-01T01:00:00Z', '2018-01-01T01:00:00Z', 'Today 01:00'],
      // Later today
      ['UTC', '2018-01-01T01:00:00Z', '2018-01-01T02:00:00Z', 'Today 02:00'],
      // Yesterday
      ['UTC', '2018-01-01T00:00:00Z', '2017-12-31T01:00:00Z', 'Yesterday 01:00'],
      // The value is more than 24 hours in the past, but still yesterday.
      ['UTC', '2018-01-01T01:00:00Z', '2017-12-31T00:00:00Z', 'Yesterday 00:00'],
      // 2 days ago
      ['UTC', '2018-01-01T00:00:00Z', '2017-12-30T00:00:00Z', 'Saturday 00:00'],
      // 3 days ago
      ['UTC', '2018-01-01T00:00:00Z', '2017-12-29T00:00:00Z', 'Friday 00:00'],
      // 4 days ago
      ['UTC', '2018-01-01T00:00:00Z', '2017-12-28T00:00:00Z', 'Thursday 00:00'],
      // 5 days ago
      ['UTC', '2018-01-01T00:00:00Z', '2017-12-27T00:00:00Z', 'Wednesday 00:00'],
      // 6 days ago
      ['UTC', '2018-01-01T00:00:00Z', '2017-12-26T00:00:00Z', '2017/12/26 00:00'],
      // Tomorrow
      ['UTC', '2018-01-01T00:00:00Z', '2018-01-02T00:00:00Z', '2018/01/02 00:00'],
      // The time part is always HH:mm.
      ['UTC', '2018-01-01T00:00:00Z', '2018-01-01T01:02:59Z', 'Today 01:02'],
      ['UTC', '2018-01-01T00:00:00Z', '2018-01-01T23:59:59Z', 'Today 23:59'],
      // The value is converted to the default time zone.
      ['UTC-1', '2018-01-01T01:00:00Z', '2018-01-01T02:00:00Z', 'Today 01:00'],
      ['UTC-1', '2018-01-01T01:00:00Z', '2018-01-02T00:00:00-02:00', '2018/01/02 01:00'],
      // Within UTC, the value is the same date as the current time, but within
      // the default time zone, it is a different date.
      ['UTC-1', '2018-01-01T01:00:00Z', '2018-01-01T00:00:00Z', 'Yesterday 23:00'],
      // Within UTC, the value is a different date from the current time, but
      // within the default time zone, it is the same date.
      ['UTC-1', '2018-01-01T01:00:00Z', '2018-01-02T00:00:00Z', 'Today 23:00']
    ];
    for (const [defaultZoneName, now, rawValue, formatted] of cases) {
      it(`formats '${rawValue}' when it is now ${now} (${defaultZoneName})`, () => {
        const restoreLuxon = setLuxon({ defaultZoneName, now });
        formatDate(rawValue).should.equal(formatted);
        restoreLuxon();
      });
    }
  });
});
