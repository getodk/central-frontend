import { describe, it } from 'vitest';
import { createXFormsTestContext } from '../helpers.ts';

describe('time zones other than the default test zone', () => {
  it('returns now() in a zone ahead of UTC with a half-hour offset', () => {
    const testContext = createXFormsTestContext(undefined, { timeZoneId: 'Asia/Kolkata' });

    testContext.assertStringValue('now()', '2026-11-25T08:00:00.000+05:30');
  });

  describe('with daylight saving time', () => {
    const format = (value: string) => `format-date-time("${value}", "%Y-%m-%d %H:%M")`;

    it('formats a datetime in standard time', () => {
      const testContext = createXFormsTestContext(undefined, {
        timeZoneId: 'America/Los_Angeles',
      });

      testContext.assertStringValue(format('2024-01-01T12:00:00Z'), '2024-01-01 04:00');
    });

    it('formats a datetime in daylight saving time', () => {
      const testContext = createXFormsTestContext(undefined, {
        timeZoneId: 'America/Los_Angeles',
      });

      testContext.assertStringValue(format('2024-07-01T12:00:00Z'), '2024-07-01 05:00');
    });
  });
});
