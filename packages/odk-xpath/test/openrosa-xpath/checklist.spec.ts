import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

// @see https://docs.opendatakit.org/form-operators-functions/?highlight=checklist#checklist
describe('#checklist()', () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  [
    { expression: "checklist(-1, 2, 2>1)", expected: true },
    { expression: "checklist(-1, 2, 1=1, 2=2, 3=3)", expected: false },
    { expression: "checklist(1, 2, 1=1, 2=2, 3=3)", expected: false },
    { expression: "checklist(1, 1, 1=1)", expected: true },
    { expression: "checklist(1, 1, true(), false(), false())", expected: true },
  ].forEach(({ expression, expected }) => {
    it(`evaluates ${expression} to ${expected}`, () => {
      testContext.assertBooleanValue(expression, expected);
    });
  });

  [
    { expression: "checklist(2, 2, * )", id: 'FunctionChecklistCase', expected: true },
    { expression: "checklist(-1, 2, self::node())", id: 'FunctionChecklistCaseEmpty', expected: true },
    { expression: "checklist(1, 2, self::node())", id: 'FunctionChecklistCaseEmpty', expected: false },
  ].forEach(({ expression, id, expected }) => {
    it(`evaluates ${expression} with context #${id} to ${expected}`, () => {
      testContext = createTestContext(`
        <div id="FunctionChecklistCase">
          <div id="FunctionChecklistCaseNo">no</div>
          <div id="FunctionChecklistCaseEmpty"></div>
          <div id="FunctionChecklistCase0">0</div>
        </div>`);

      const contextNode = testContext.document.getElementById(id)!;

      testContext.assertBooleanValue(expression, expected, {
        contextNode,
      });
    });
  });
});
