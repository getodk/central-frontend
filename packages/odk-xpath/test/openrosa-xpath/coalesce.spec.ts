import type { TestContext } from '../helpers.ts';
import {
  createTestContext,
  createTextContentTestContext,
} from '../helpers.ts';

describe('#coalesce()', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  it('should return first value if provided via xpath', () => {
    testContext = createTextContentTestContext('first');

    testContext.assertStringValue('coalesce(/simple/xpath/to/node, "whatever")', 'first');
  });

  it('should return first value if provided via string', () => {
    testContext.assertStringValue('coalesce("FIRST", "whatever")', 'FIRST');
  });

  it('should return second value from xpath if first value is empty string', () => {
    testContext = createTextContentTestContext('second');

    testContext.assertStringValue('coalesce("", /simple/xpath/to/node)', 'second');
  });

  it('should return second value from string if first value is empty string', () => {
    testContext.assertStringValue('coalesce("", "SECOND")', 'SECOND');
    testContext.assertStringValue("coalesce('', 'ab')", 'ab');
  });

  it('should return second value from xpath if first value is empty xpath', () => {
    testContext = createTextContentTestContext('second');

    testContext.assertStringValue('coalesce(/simple/empty, /simple/xpath/to/node)', 'second');
  });

  it('should return second value from string if first value is empty xpath', () => {
    testContext.assertStringValue('coalesce(/simple/xpath/to/node, "SECOND")', 'SECOND');
  });

  it('coalesce(self::*)', () => {
    testContext = createTestContext(`
      <div id="FunctionSelectedCase">
        <div id="FunctionSelectedCaseEmpty"></div>
        <div id="FunctionSelectedCaseSingle">ab</div>
        <div id="FunctionSelectedCaseMultiple">ab cd ef gh</div>
        <div id="FunctionSelectedCaseMultiple">ij</div>
      </div>`);

    let contextNode = testContext.document.getElementById('FunctionSelectedCaseEmpty');

    testContext.assertStringValue("coalesce(self::*, 'ab')", 'ab', {
      contextNode,
    });

    contextNode = testContext.document.getElementById('FunctionSelectedCaseSingle');

    testContext.assertStringValue("coalesce(self::*, 'cd')", 'ab', {
      contextNode,
    });
  });
});
