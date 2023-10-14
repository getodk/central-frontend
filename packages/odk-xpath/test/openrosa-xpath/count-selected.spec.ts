import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#count-selected()', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext(`
    <div id="FunctionSelectedCase">
      <div id="FunctionSelectedCaseEmpty"></div>
      <div id="FunctionSelectedCaseSingle">ab</div>
      <div id="FunctionSelectedCaseMultiple">ab cd ef gh</div>
      <div id="FunctionSelectedCaseMultiple">ij</div>
    </div>`);
  });

  [
    { id: 'FunctionSelectedCaseEmpty', expected: 0 },
    { id: 'FunctionSelectedCaseSingle', expected: 1 },
    { id: 'FunctionSelectedCaseMultiple', expected: 4 },
  ].forEach(({ id, expected }) => {
    it(`count-selected(self::node()) where context node has id ${id}`, () => {
      const contextNode = testContext.document.getElementById(id);

      testContext.assertNumberValue('count-selected(self::node())', expected, {
        contextNode,
      });
    });
  });
});
