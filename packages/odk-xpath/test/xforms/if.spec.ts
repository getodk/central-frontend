import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#if()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should return first option if true', () => {
		testContext.assertStringValue('if(true(), "a", "b")', 'a');
		testContext.assertNumberValue('if(true(), 5, "abc")', 5);
	});

	it('should return second option if false', () => {
		testContext.assertStringValue('if(false(), "a", "b")', 'b');
		testContext.assertStringValue('if(false(), 5, "abc")', 'abc');
		testContext.assertStringValue('if(6 > 7, 5, "abc")', 'abc');
		testContext.assertStringValue('if("", 5, "abc")', 'abc');
	});

	describe('with node evaluation', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`
      <div id="FunctionChecklistCase">
        <div id="FunctionChecklistCaseNo">no</div>
        <div id="FunctionChecklistCaseEmpty"></div>
        <div id="FunctionChecklistCase0">0</div>
      </div>`);
		});

		it(`should evaluate an existing node as true`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCaseEmpty');

			testContext.assertStringValue('if(self::node(), "exists", "does not exist")', 'exists', {
				contextNode,
			});
		});

		it(`should evaluate a non-existing node as false`, () => {
			testContext.assertStringValue('if(/unreal, "exists", "does not exist")', 'does not exist');
		});

		it(`should evaluate an "and" expression that checks values of nodes (1)`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCase0');

			testContext.assertStringValue(
				'if(. != "0" and /div/div[@id="FunctionCheckListCaseEmpty"] != "", "yes", "no")',
				'no',
				{
					contextNode,
				}
			);
		});

		it(`should evaluate an "and" expression that checks values of nodes (2)`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCase0');

			testContext.assertStringValue(
				'if(. = "0" and /div/div[@id="FunctionCheckListCaseEmpty"] != "", "yes", "no")',
				'no',
				{
					contextNode,
				}
			);
		});

		it(`should evaluate an "and" expression that checks values of nodes (3)`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCase0');

			testContext.assertStringValue(
				'if(. = "0" and /div/div[@id="FunctionChecklistCaseNo"] ="no", "yes", "no")',
				'yes',
				{
					contextNode,
				}
			);
		});

		it(`should evaluate an "or" expression that checks values of nodes (1)`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCase0');

			testContext.assertStringValue(
				'if(. != "0" or /div/div[@id="FunctionCheckListCaseEmpty"] != "", "yes", "no")',
				'no',
				{
					contextNode,
				}
			);
		});

		it(`should evaluate an "or" expression that checks values of nodes (2)`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCase0');

			testContext.assertStringValue(
				'if(. = "0" or /div/div[@id="FunctionCheckListCaseEmpty"] != "", "yes", "no")',
				'yes',
				{
					contextNode,
				}
			);
		});

		it(`should evaluate an "or" expression that checks values of nodes (3)`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCase0');

			testContext.assertStringValue(
				'if(. != "0" or /div/div[@id="FunctionChecklistCaseNo"] ="no", "yes", "no")',
				'yes',
				{
					contextNode,
				}
			);
		});

		it(`should evaluate true and false outcomes`, () => {
			const contextNode = testContext.document.getElementById('FunctionChecklistCase0');

			testContext.assertStringValue(
				'if(false(), "yes", concat(/div/div[@id="FunctionChecklistCaseNo"], "-no"))',
				'no-no',
				{
					contextNode,
				}
			);
		});
	});

	describe('should deal with nesting and lengthy or/and clauses (with booleans)', () => {
		[
			{ expression: 'if( false() and true(), "A", if(false(), "B", "C") )', expected: 'C' },
			{
				expression: 'if( false() and explode-a(), "A", if(false() and explode-b(), "B", "C") )',
				expected: 'C',
			},
			{
				expression:
					'if( false() and explode-a(), "A", if(false() and explode-b(), "B", true() or false()) )',
				expected: 'true',
			},
			{
				expression:
					'if( false() and explode-a(), "A", if(false() and explode-b(), "B", false() or true()) )',
				expected: 'true',
			},
			{
				expression:
					'if( false() and explode-a(), "A", if(false() and explode-b(), "B", false() and true()) )',
				expected: 'false',
			},
			{
				expression:
					'if( false() and explode-a(), "A", if(false() and explode-b(), "B", true() and false()) )',
				expected: 'false',
			},
			{
				expression:
					'if( false() and explode-a(), "A", if(false() and explode-b(), "B", false() and false()) )',
				expected: 'false',
			},
			{
				expression:
					'if( false() and explode-a(), "A", if(false() and explode-b(), "B", true() and true()) )',
				expected: 'true',
			},
			{
				expression:
					'if( false() and explode-a(), "A", if(true() or explode-b(), false() and explode-c(), true() or explode-d()) )',
				expected: 'false',
			},
			{
				expression:
					'if( true() or true() and false(), "A", if(true() or true() and false(), true() or true() and false(), "B") )',
				expected: 'A',
			},
			{
				expression:
					'if( true() or true() and false(), "A", if(true() or true() and false(), true() or true() and false(), true() or true() and explode-d()) )',
				expected: 'A',
			},
			{
				expression:
					'if( true() or true() and false(), "A", if(true() or true() and false(), true() or true() and explode-c(), true() or true() and explode-d()) )',
				expected: 'A',
			},
			{
				expression:
					'if( true() or true() and false(), "A", if(true() or true() and explode-b(), true() or true() and explode-c(), true() or true() and explode-d()) )',
				expected: 'A',
			},
			{
				expression:
					'if( true() or true() and explode-a(), "A", if(true() or true() and explode-b(), true() or true() and explode-c(), true() or true() and explode-d()) )',
				expected: 'A',
			},
		].forEach(({ expression, expected }) => {
			it(`should evaluate "${expression}" as "${expected}"`, () => {
				testContext.assertStringValue(expression, expected);
			});
		});
	});

	describe('should deal with nesting and lengthy or/and clauses (with derived values)', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`
        <data>
          <a/>
          <b/>
          <c>1</c>
          <d>0</d>
        </data>`);
		});
		// TODO: this is a lazy test taken directly from a real form. It probably should be removed the minimal test cases below it seem to be sufficient, but it will be helpful during bug fixing. None of these nodes exist in the doc.
		it(`long sequence of "and" clauses and nested if() with long sequence of "or clauses" (non-minimized test case)`, () => {
			testContext.assertStringValue(
				'if( /model/instance[1]/data/page-welcome/GRP_ELIG/AGE_IC ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/INC_TEMP ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/NO_SEV_ILLNESS ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/FU_POSSIBLE ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/SAMPLE_COL_POSSIBLE ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/PROVIDE_INFORM_CONSENT ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/FEVER_RESP ="1", "Eligible", if( /model/instance[1]/data/page-welcome/GRP_ELIG/AGE_IC ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/INC_TEMP ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/NO_SEV_ILLNESS ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/FU_POSSIBLE ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/SAMPLE_COL_POSSIBLE ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/PROVIDE_INFORM_CONSENT ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/FEVER_RESP ="0", "Not-Eligible", "nothing"))',
				'nothing'
			);
		});

		it(`sequence of "and" clauses and nested if() with sequence of "or" clauses (1)`, () => {
			testContext.assertStringValue(
				'if( /data/a ="1" and /data/b ="1", "Eligible", if( /data/a ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
				'nothing'
			);
		});

		it(`sequence of "and" clauses and nested if() with sequence of "or" clauses (2)`, () => {
			testContext.assertStringValue(
				'if( /data/a ="1" and /data/c ="1", "Eligible", if( /data/a ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
				'nothing'
			);
		});

		it(`sequence of "and" clauses and nested if() with sequence of "or" clauses (3)`, () => {
			testContext.assertStringValue(
				'if( /data/c ="1" and /data/b ="1", "Eligible", if( /data/a ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
				'nothing'
			);
		});

		it(`sequence of "and" clauses and nested if() with sequence of "or" clauses (4)`, () => {
			testContext.assertStringValue(
				'if( /data/a ="1" and /data/b ="1", "Eligible", if( /data/a ="0" or /data/d ="0", "Not-Eligible", "nothing"))',
				'Not-Eligible'
			);
		});

		it(`sequence of "and" clauses and nested if() with sequence of "or" clauses (5)`, () => {
			testContext.assertStringValue(
				'if( /data/a ="1" and /data/b ="1", "Eligible", if( /data/d ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
				'Not-Eligible'
			);
		});
	});

	describe('deviation from the XForms spec', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`<data><a/><b/><b/></data>`);
		});

		describe('it should NOT coerce the result to a string', () => {
			[
				{ expression: 'if(true(), true(), false())', expected: { string: 'true', boolean: true } },
				{
					expression: 'if(false(), true(), false())',
					expected: { string: 'false', boolean: false },
				},
			].forEach(({ expression, expected }) => {
				it(`should return string value '${expected.string}' and boolean value '${expected.boolean}' for expression '${expression}'`, () => {
					testContext.assertStringValue(expression, expected.string);
					testContext.assertBooleanValue(expression, expected.boolean);
				});
			});

			[{ expression: 'count( if(true(), //b, //a ))', expected: 2 }].forEach(
				({ expression, expected }) => {
					it(`should return node-set values for if() expression '${expression}'`, () => {
						testContext.assertNumberValue(expression, expected);
					});
				}
			);
		});
	});
});
