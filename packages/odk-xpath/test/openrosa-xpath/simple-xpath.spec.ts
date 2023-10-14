import type { TestContext } from '../helpers.ts';
import {
	createTestContext,
	createTextContentTestContext,
} from '../helpers.ts';

describe('openrosa-xpath', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  it('should process simple xpaths', () => {
    testContext = createTextContentTestContext('val');

    testContext.assertStringValue('/simple/xpath/to/node', 'val');
  });
});
