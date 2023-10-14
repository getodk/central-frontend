import type { TestContext } from '../helpers.ts';
import {
  createTestContext,
  createTextContentTestContext,
} from '../helpers.ts';

describe('#pow()', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  describe('should return power of text values', () => {
    it('3^0', () => {
      testContext = createTextContentTestContext('3');

      testContext.assertNumberValue('pow(/simple/xpath/to/node, 0)', 1);
    });

    it('1^3', () => {
      testContext = createTextContentTestContext('1');

      testContext.assertNumberValue('pow(/simple/xpath/to/node, 3)', 1);
    });

    it('4^2', () => {
      testContext = createTextContentTestContext('4');

      testContext.assertNumberValue('pow(/simple/xpath/to/node, 2)', 16);
    });

    it('no input pow', () => {
      testContext.assertNumberValue('pow(2, 2)', 4);
      testContext.assertNumberValue('pow(2, 0)', 1);
      testContext.assertNumberValue('pow(0, 4)', 0);
      testContext.assertNumberValue('pow(2.5, 2)', 6.25);
      testContext.assertNumberValue('pow(0.5, 2)', 0.25);
      testContext.assertNumberValue('pow(-1, 2)', 1);
      testContext.assertNumberValue('pow(-1, 3)', -1);
      testContext.assertNumberValue('pow(4, 0.5)', 2);
      testContext.assertNumberValue('pow(16, 0.25)', 2);
    });
  });
});
