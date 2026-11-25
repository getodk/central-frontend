import { describe, expect, it } from 'vitest';
import { DateValueCodec } from '../../../src/lib/codecs/DateValueCodec';
import { Temporal } from 'temporal-polyfill';

describe('DateValueCodec', () => {
  const codec = new DateValueCodec();

  describe('encode', () => {
    it.each([
      { input: null, expected: '' },
      { input: '', expected: '' },
      { input: 'garbage', expected: '' },
      { input: '1', expected: '1970-01-02' },
      { input: Temporal.PlainDate.from({ year: 2000, month: 2, day: 5 }), expected: '2000-02-05' },
      { input: Temporal.PlainDateTime.from('2026-05-01T23:15:01'), expected: '2026-05-01' },
      { input: new Date('2026-06-09T11:12:13'), expected: '2026-06-09' },
      { input: '2026-05-01T23:15:01', expected: '2026-05-01' },
    ])('turns $input into $expected', ({ input, expected }) => {
      const actual = codec.encodeValue(input);
      expect(actual).to.equal(expected);
    });
  });

  describe('decode', () => {
    it.each([
      { input: '', expected: null },
      { input: 'garbage', expected: null },
      {
        input: '555',
        expected: Temporal.PlainDate.from({ year: 1971, month: 7, day: 10 }).toString(),
      },
      {
        input: '2000-02-05',
        expected: Temporal.PlainDate.from({ year: 2000, month: 2, day: 5 }).toString(),
      },
      {
        input: '2000-02-05T10:11:12',
        expected: Temporal.PlainDate.from({ year: 2000, month: 2, day: 5 }).toString(),
      },
    ])('turns $input into $expected', ({ input, expected }) => {
      const actual = codec.decodeValue(input);
      if (expected == null) {
        expect(actual).toBeNull();
      } else {
        expect(actual?.toString()).to.equal(expected.toString());
      }
    });
  });
});
