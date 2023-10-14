import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('ends-with', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  it('ends-with', () => {
    testContext.assertBooleanValue('ends-with("", "")', true);
    testContext.assertBooleanValue('ends-with("a", "")', true);
    testContext.assertBooleanValue('ends-with("a", "a")', true);
    testContext.assertBooleanValue('ends-with("a", "b")', false);
    testContext.assertBooleanValue('ends-with("ba", "a")', true);
    testContext.assertBooleanValue('ends-with("", "b")', false);
  });

  it.fails('ends-with() fails when too many arguments are provided', () => {
    testContext.evaluate('ends-with(1, 2, 3)');
  });

  [
    { expression: 'ends-with()' },
    { expression: 'ends-with(1)' },
  ].forEach(({ expression }) => {
    it.fails(`${expression} fails when not enough arguments are provided`, () => {
      testContext.evaluate(expression);
    });
  });

  it('with a node parameter', () => {
    testContext = createTestContext(`
      <data>
        <a id="A">TAXIcab</a>
      </data>`);

    testContext.assertBooleanValue('ends-with( /data/a, "cab")', true);
  });

});
