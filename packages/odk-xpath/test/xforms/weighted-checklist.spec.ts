import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

// @see https://docs.opendatakit.org/form-operators-functions/?highlight=checklist#weighted-checklist
describe('#weighted-checklist()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('simple', () => {
		// Note: test for two node-set arguments done elsewhere
		testContext.assertBooleanValue('weighted-checklist(-1, 2, 2>1, 2)', true);
		testContext.assertBooleanValue('weighted-checklist(-1, 2, 2>1, 3)', false);
		testContext.assertBooleanValue('weighted-checklist(-1, 2, 1=1, 1, 2=2, 1, 3=3, 1)', false);
		testContext.assertBooleanValue('weighted-checklist(1, 2, 1=1, 1, 2=2, 1, 3=3, 1)', false);
		testContext.assertBooleanValue('weighted-checklist(1, 1, 1=1, 1)', true);
		testContext.assertBooleanValue('weighted-checklist(1, 1, 1=1, 0)', false);
		testContext.assertBooleanValue(
			'weighted-checklist(2, 2, true(), 2, false(), 5, false(), 6)',
			true
		);
		testContext.assertBooleanValue(
			'weighted-checklist(2, -1, true(), 999, false(), 5, false(), 6)',
			true
		);
	});

	it('with nodes', () => {
		testContext = createXFormsTestContext(`
      <root>
        <div id="FunctionChecklistCase">
          <div id="FunctionChecklistCaseNo">no</div>
          <div id="FunctionChecklistCaseEmpty"></div>
          <div id="FunctionChecklistCase0">0</div>
        </div>

        <div id="FunctionChecklistCaseValues">
          <div>1</div>
          <div>1</div>
          <div>5</div>
        </div>

        <div id="FunctionWeightedChecklist">3</div>
      </root>`);
		const { document } = testContext;

		let contextNode = document.getElementById('FunctionChecklistCase0');

		testContext.assertBooleanValue('weighted-checklist(5, 5, self::* ,5)', true, {
			contextNode,
		});

		contextNode = document.getElementById('FunctionChecklistCaseEmpty');

		testContext.assertBooleanValue('weighted-checklist(-1, 2, self::node(), 0)', true, {
			contextNode,
		});
		testContext.assertBooleanValue('weighted-checklist(1, 2, self::node(), 1)', false, {
			contextNode,
		});

		contextNode = document.getElementById('FunctionWeightedChecklist');

		testContext.assertBooleanValue('weighted-checklist(3, 3, 1=1, self::node())', true, {
			contextNode,
		});
	});

	[
		{
			expression: 'weighted-checklist(9, 9, /thedata/somenodes/*, /thedata/someweights/*)',
			expected: true,
		},
		{
			expression: 'weighted-checklist(8, 8, /thedata/somenodes/*, /thedata/someweights/*)',
			expected: false,
		},
		{
			expression: 'weighted-checklist(10, 10, /thedata/somenodes/*, /thedata/someweights/*)',
			expected: false,
		},
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext = createXFormsTestContext(`
        <thedata id="thedata">
          <somenodes>
            <A>one</A>
            <B>one</B>
            <C>one</C>
          </somenodes>
          <someweights>
            <w1>1</w1>
            <w2>3</w2>
            <w.3>5</w.3>
          </someweights>
        </thedata>`);

			testContext.assertBooleanValue(expression, expected);
		});
	});
});
