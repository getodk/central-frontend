import { describe, expect, it } from 'vitest';
import { Temporal } from 'temporal-polyfill';
import { DateTimeValueCodec } from '../../../src/lib/codecs/DateTimeValueCodec';

describe('DateTimeValueCodec', () => {
  const codec = new DateTimeValueCodec();

  const makeZonedDateTime = (date: string) =>
    Temporal.Instant.from(date).toZonedDateTimeISO(Temporal.Now.timeZoneId());

  describe('encode', () => {
    it.each([
      { input: null, expected: '' },
      { input: '', expected: '' },
      { input: 'garbage', expected: '' },
      { input: '1', expected: '1970-01-02T00:00:00.000+00:00' },
      {
        input: makeZonedDateTime('2026-05-01T23:15:01.000+12:00'),
        expected: '2026-05-01T11:15:01.000+00:00',
      },
    ])('turns $input into $expected', ({ input, expected }) => {
      const actual = codec.encodeValue(input);
      if (actual == '') {
        expect(actual).to.equal(expected);
      } else {
        // need to handle timezone differences
        const expectedDT = makeZonedDateTime(expected);
        const equivalent = Temporal.PlainDateTime.from(actual).equals(expectedDT);

        expect(equivalent).toBeTruthy();
      }
    });
  });

  describe('decode', () => {
    it.each([
      { input: '', expected: null },
      { input: 'garbage', expected: null },
      { input: '2000-02-05', expected: null },
      { input: '555', expected: makeZonedDateTime('1971-07-10T00:00:00.000+00:00') },
    ])('turns $input into $expected', ({ input, expected }) => {
      const actual = codec.decodeValue(input);
      if (expected == null) {
        expect(actual).toBeNull();
      } else {
        const equivalent = Temporal.PlainDateTime.from(actual!).equals(expected);
        expect(equivalent).toBeTruthy();
      }
    });
  });
});
