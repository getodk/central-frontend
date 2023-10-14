import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#abs()', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  it('abs', () => {
    testContext.assertNumberValue('abs(10.5)', 10.5);
    testContext.assertNumberValue('abs(-10.5)', 10.5);
    testContext.assertNumberValue('abs("-10.5")', 10.5);
    testContext.assertNumberValue('abs("a")', NaN);
  });
});
