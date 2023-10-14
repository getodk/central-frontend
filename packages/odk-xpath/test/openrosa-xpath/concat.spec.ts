import type { TestContext } from '../helpers.ts';
import {
  createTestContext,
  createTextContentTestContext,
} from '../helpers.ts';

describe('#concat', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  it('should concatenate two xpath values', () => {
    testContext = createTextContentTestContext('jaja');

    // TODO: this was previously named `regex`, but it is clearly not a regular
    // expression. Copypasta?!
    const expression = 'concat(/simple/xpath/to/node, /simple/xpath/to/node)';

    testContext.assertStringValue(expression, 'jajajaja');
  });

  it('should concatenate two string values', () => {
    testContext.assertStringValue('concat("port", "manteau")', 'portmanteau');
  });

  it('should concatenate a string and an xpath value', () => {
    testContext = createTextContentTestContext('port');

    testContext.assertStringValue('concat(/simple/xpath/to/node, "manteau")', 'portmanteau');
  });

  it('should concatenate an xpath and a string value', () => {
    testContext = createTextContentTestContext('port');

    testContext.assertStringValue('concat(/simple/xpath/to/node, "manteau")', 'portmanteau');
  });

  it('should concatenate simple values', () => {
    testContext.assertStringValue('concat("a")', 'a');
    testContext.assertStringValue('concat("a", "b", "")', 'ab');
  });

  // Javarosa accepts an optional node-set argument for concat which deviates from native XPath. It also accepts no arguments.
  it('should concatenate nodeset', () => {
    testContext = createTestContext(`
      <div id="testFunctionNodeset">
        <div id="testFunctionNodeset2">
          <p>1</p>
          <p>2</p>
          <p>3</p>
          <p>4</p>
        </div>
      </div>`);

    const contextNode = testContext.document.getElementById('testFunctionNodeset2');

    testContext.assertStringValue("concat(*, 'a')", '1234a', {
      contextNode,
    });
    testContext.assertStringValue("concat(*)", '1234', {
      contextNode,
    });
    testContext.assertStringValue("concat()", '', {
      contextNode,
    });
  });
});
