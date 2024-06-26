import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

const SIMPLE_DATE_MATCH = /^\d{4}-[0-1]\d-[0-3]\d$/;
const SIMPLE_DATE_OR_DATE_TIME_MATCH =
	/^\d{4}-[0-1]\d-[0-3]\d(T[0-2]\d:[0-5]\d:[0-5]\d\.\d\d\d(Z|[+-][0-1]\d(:[0-5]\d)?))?$/;

const isDocument = (node: Node | null) => {
	return node?.nodeName === '#document';
};

describe('some complex examples', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	[
		{
			expression: 'concat("uuid:", uuid())',
			match: /uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/,
		},
		{ expression: '"2015-07-15" < today()', expected: true },
		{ expression: "'2015-07-15' > today()", expected: false },
		{ expression: "'raw-string'", expected: 'raw-string' },
		{
			expression: 'format-date-time(date-time(decimal-date-time("2003-03-12") + 280), "%b %e, %Y")',
			match: /^Dec 17, 2003$/,
		},
		{ expression: 'decimal-date-time(today()- 60 )', match: /^-?[0-9]+(\.[0-9]+)?$/ },
		{ expression: 'date-time(decimal-date-time(today()- 60 ))', match: SIMPLE_DATE_MATCH },
		{ expression: "if(selected('date' ,'date'), 'first' ,'second')", match: /^first$/ },
		{ expression: "if(selected('approx' ,'date'), 'first' ,'second')", match: /^second$/ },
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, 'testing')",
			match: /testing/,
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, concat('testing', '1', '2', '3', '...'))",
			match: /testing/,
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, date-time(0))",
			match: SIMPLE_DATE_OR_DATE_TIME_MATCH,
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, date-time(decimal-date-time(today() - 60)))",
			match: SIMPLE_DATE_MATCH,
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method ,'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date ,date-time(decimal-date-time(today()- 60 )))",
			match: SIMPLE_DATE_MATCH,
		},
		{ expression: 'if(true(), today(), today())', match: SIMPLE_DATE_MATCH },
		{ expression: 'if(false(), today(), today())', match: SIMPLE_DATE_MATCH },
		{ expression: 'if(true(), "", today())', match: /^$/ },
		{ expression: 'if(false(), "", today())', match: SIMPLE_DATE_MATCH },
		{ expression: 'if(true(), today(), "")', match: SIMPLE_DATE_MATCH },
		{ expression: 'if(false(), today(), "")', match: /^$/ },
		{ expression: 'coalesce(today(), "")', match: SIMPLE_DATE_MATCH },
		{ expression: 'coalesce("", today())', match: SIMPLE_DATE_MATCH },
		{ expression: 'true() or true() or true()', expected: true },
		{ expression: 'true() or true() or false()', expected: true },
		{ expression: 'true() or false() or true()', expected: true },
		{ expression: 'false() or true() or true()', expected: true },
		{ expression: 'true() or false() or false()', expected: true },
		{ expression: 'false() or true() or false()', expected: true },
		{ expression: 'false() or false() or true()', expected: true },
		{ expression: 'false() or false() or false()', expected: false },
		{ expression: '(true() or true()) or true()', expected: true },
		{ expression: '(true() or true()) or false()', expected: true },
		{ expression: '(true() or false()) or true()', expected: true },
		{ expression: '(false() or true()) or true()', expected: true },
		{ expression: '(true() or false()) or false()', expected: true },
		{ expression: '(false() or true()) or false()', expected: true },
		{ expression: '(false() or false()) or true()', expected: true },
		{ expression: '(false() or false()) or false()', expected: false },
		{ expression: 'true() or (true() or true())', expected: true },
		{ expression: 'true() or (true() or false())', expected: true },
		{ expression: 'true() or (false() or true())', expected: true },
		{ expression: 'false() or (true() or true())', expected: true },
		{ expression: 'true() or (false() or false())', expected: true },
		{ expression: 'false() or (true() or false())', expected: true },
		{ expression: 'false() or (false() or true())', expected: true },
		{ expression: 'false() or (false() or false())', expected: false },
		{ expression: '(true() and true()) or true()', expected: true },
		{ expression: '(true() and true()) or false()', expected: true },
		{ expression: '(true() and false()) or true()', expected: true },
		{ expression: '(false() and true()) or true()', expected: true },
		{ expression: '(true() and false()) or false()', expected: false },
		{ expression: '(false() and true()) or false()', expected: false },
		{ expression: '(false() and false()) or true()', expected: true },
		{ expression: '(false() and false()) or false()', expected: false },
		{ expression: 'true() or (true() and true())', expected: true },
		{ expression: 'true() or (true() and false())', expected: true },
		{ expression: 'true() or (false() and true())', expected: true },
		{ expression: 'false() or (true() and true())', expected: true },
		{ expression: 'true() or (false() and false())', expected: true },
		{ expression: 'false() or (true() and false())', expected: false },
		{ expression: 'false() or (false() and true())', expected: false },
		{ expression: 'false() or (false() and false())', expected: false },
		{ expression: '(true() or true()) and true()', expected: true },
		{ expression: '(true() or true()) and false()', expected: false },
		{ expression: '(true() or false()) and true()', expected: true },
		{ expression: '(false() or true()) and true()', expected: true },
		{ expression: '(true() or false()) and false()', expected: false },
		{ expression: '(false() or true()) and false()', expected: false },
		{ expression: '(false() or false()) and true()', expected: false },
		{ expression: '(false() or false()) and false()', expected: false },
		{ expression: '(true() and true()) and true()', expected: true },
		{ expression: '(true() and true()) and false()', expected: false },
		{ expression: '(true() and false()) and true()', expected: false },
		{ expression: '(false() and true()) and true()', expected: false },
		{ expression: '(true() and false()) and false()', expected: false },
		{ expression: '(false() and true()) and false()', expected: false },
		{ expression: '(false() and false()) and true()', expected: false },
		{ expression: '(false() and false()) and false()', expected: false },
		{ expression: 'true() and true() and true()', expected: true },
		{ expression: 'true() and true() and false()', expected: false },
		{ expression: 'true() and false() and true()', expected: false },
		{ expression: 'false() and true() and true()', expected: false },
		{ expression: 'true() and false() and false()', expected: false },
		{ expression: 'false() and true() and false()', expected: false },
		{ expression: 'false() and false() and true()', expected: false },
		{ expression: 'false() and false() and false()', expected: false },
		{ expression: 'true() and (true() or true())', expected: true },
		{ expression: 'true() and (true() or false())', expected: true },
		{ expression: 'true() and (false() or true())', expected: true },
		{ expression: 'true() and (false() or false())', expected: false },
		{ expression: 'false() and (true() or true())', expected: false },
		{ expression: 'false() and (true() or false())', expected: false },
		{ expression: 'false() and (false() or true())', expected: false },
		{ expression: 'false() and (false() or false())', expected: false },
		{ expression: '(true() and true()) or (false() and false())', expected: true },
		{ expression: '(true() and true()) and (false() and false())', expected: false },
		{ expression: '(true() and true()) and (false() or true())', expected: true },
		{
			expression: '((true() or false()) and (false() or true())) and (false() or true())',
			expected: true,
		},
		{
			expression: '((true() or false()) and (false() or false())) and (false() or true())',
			expected: false,
		},
		{ expression: '-1', match: /^-1$/ },
		{ expression: '1-1', match: /^0$/ },
		{ expression: '1+1', match: /^2$/ },
		{ expression: '0 > 0', expected: false },
		{ expression: '(0 > 0)', expected: false },
		{ expression: 'false() != "true"', expected: true },
		{ expression: '(false() != "true")', expected: true },
		{ expression: '(0 = 0) and (false() != "true")', expected: true },
		{ expression: '0 = 0 and false() != "true"', expected: true },
		{ expression: '(0 > 0) and (false() != "true")', expected: false },
		{ expression: '0 > 0 and false() != "true"', expected: false },
		{ expression: "if(/something, 'A', 'B' )", expected: 'B' },
		{ expression: "if(/something  != '', 'A', 'B' )", expected: 'B' },
		{ expression: "if('' != '', 'A', 'B' )", expected: 'B' },
		{ expression: "if(true(), 'A', 'B' )", expected: 'A' },
		{ expression: "if (/something, 'A', 'B' )", expected: 'B' },
		{ expression: "if (/something  != '', 'A', 'B' )", expected: 'B' },
		{ expression: "if ('' != '', 'A', 'B' )", expected: 'B' },
		{ expression: "if (true(), 'A', 'B' )", expected: 'A' },
		{ expression: "not(selected(../dob_method,'approx'))", expected: true },
		{ expression: "not(not(selected(../dob_method,'approx')))", expected: false },
		{ expression: "selected(../dob_method,'approx')", expected: false },
		{ expression: '(0) - (0)', expected: 0 },
		{ expression: '2*3', expected: 6 },
		{ expression: '(2*3)', expected: 6 },
		{ expression: '2 * 3', expected: 6 },
		{ expression: '(2 * 3)', expected: 6 },
		{ expression: '2+3', expected: 5 },
		{ expression: '(2+3)', expected: 5 },
		{ expression: '2 + 3', expected: 5 },
		{ expression: '(2 + 3)', expected: 5 },
		{ expression: '2 + 4', expected: '6' },
		{ expression: 'today() < (today() + 1)', expected: true },
		{ expression: 'today() > (today() + 1)', expected: false },
		{ expression: "today() < '1970-06-03'", expected: false },
		{ expression: "today() > '1970-06-03'", expected: true },
		{ expression: "today() + 1 < '1970-06-03'", expected: false },
		{ expression: "today() + 1 > '1970-06-03'", expected: true },
		{ expression: '.', predicate: isDocument },

		// Bracketed expressions inside vs outside function calls:

		{ expression: '1', expected: 1 },
		{ expression: '(1)', expected: 1 },
		{ expression: '(1 + 1) - 1', expected: 1 },
		{ expression: '((1 + 1) - 1)', expected: 1 },
		{ expression: '-1 + (1 + 1)', expected: 1 },
		{ expression: '(-1 + (1 + 1))', expected: 1 },

		{ expression: '3', expected: 3 },
		{ expression: '(3)', expected: 3 },
		{ expression: '(1 + 1) + 1', expected: 3 },
		{ expression: '((1 + 1) + 1)', expected: 3 },

		{ expression: 'cos(3)', expected: Math.cos(3) },
		{ expression: 'cos((1 + 1) + 1)', expected: Math.cos(3) },

		{ expression: 'cos(1)', expected: Math.cos(1) },
		{ expression: 'cos((1 + 1) - 1)', expected: Math.cos(1) },
		{ expression: 'cos(-1 + (1 + 1))', expected: Math.cos(1) },

		// These tests exposed a weird bug which would return "Too many tokens" if dot was followed by a comparator
		// In all these tests, the root node is being passed to `number()` to allow its comparison with the number
		// 1.  The text is null, so its numeric value is NaN.  This makes all comparisons return false.

		{ expression: '.>1', expected: false },
		{ expression: '.> 1', expected: false },
		{ expression: '. >1', expected: false },
		{ expression: '. > 1', expected: false },
		{ expression: '.>=1', expected: false },
		{ expression: '.>= 1', expected: false },
		{ expression: '. >=1', expected: false },
		{ expression: '. >= 1', expected: false },
		{ expression: '.<1', expected: false },
		{ expression: '.< 1', expected: false },
		{ expression: '. <1', expected: false },
		{ expression: '. < 1', expected: false },
		{ expression: '.<=1', expected: false },
		{ expression: '.<= 1', expected: false },
		{ expression: '. <=1', expected: false },
		{ expression: '. <= 1', expected: false },

		{ expression: '1=1', expected: true },
		{ expression: '1=0', expected: false },
		{ expression: '0=1', expected: false },

		{ expression: '1 =1', expected: true },
		{ expression: '1 =0', expected: false },
		{ expression: '0 =1', expected: false },

		{ expression: '1= 1', expected: true },
		{ expression: '1= 0', expected: false },
		{ expression: '0= 1', expected: false },

		{ expression: '1 = 1', expected: true },
		{ expression: '1 = 0', expected: false },
		{ expression: '0 = 1', expected: false },

		{ expression: "../some-path='some-value'", expected: false },
		{ expression: '../some-path="some-value"', expected: false },
		{ expression: "../some-path= 'some-value'", expected: false },
		{ expression: "../some-path ='some-value'", expected: false },
		{ expression: "../some-path = 'some-value'", expected: false },

		{ expression: "'some-value'=../some-path", expected: false },
		{ expression: '"some-value"=../some-path', expected: false },
		{ expression: "'some-value'= ../some-path", expected: false },
		{ expression: "'some-value' =../some-path", expected: false },
		{ expression: "'some-value' = ../some-path", expected: false },
	].forEach(({ expression, expected, match, predicate }) => {
		it(
			'should convert "' +
				expression +
				'" to match "' +
				String(expected ?? match ?? predicate) +
				'"',
			() => {
				if (predicate != null) {
					const { singleNodeValue } = testContext.evaluate(
						expression,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE
					);

					expect(predicate(singleNodeValue)).toEqual(true);

					return;
				}

				if (match != null) {
					testContext.assertStringMatches(expression, match);

					return;
				}

				switch (typeof expected) {
					case 'boolean':
						testContext.assertBooleanValue(expression, expected);
						break;

					case 'number':
						testContext.assertNumberValue(expression, expected);
						break;

					case 'string':
						testContext.assertStringValue(expression, expected);
						break;

					default:
						throw new UnreachableError(expected);
				}
			}
		);
	});
});
