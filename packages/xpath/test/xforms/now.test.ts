import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#now()', () => {
  let testContext: XFormsTestContext;

  beforeEach(() => {
    testContext = createXFormsTestContext();
  });

  // ODK spec says:
  // > Deviates from XForms 1.0 in that it returns the current date and time
  // > including timezone offset (i.e. not normalized to UTC) as described
  // > under the dateTime datatype.
  it('should return a timestamp for this instant', () => {
    testContext.assertStringValue('now()', '2026-11-24T19:30:00.000-07:00');
  });
});
