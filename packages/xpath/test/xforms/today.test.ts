import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#today()', () => {
  let testContext: XFormsTestContext;

  beforeEach(() => {
    testContext = createXFormsTestContext();
  });

  it("should return today's date", () => {
    testContext.assertStringValue('today()', '2026-11-24');
  });
});
