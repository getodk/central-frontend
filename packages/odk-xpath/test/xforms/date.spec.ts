import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, namespaceResolver } from '../helpers.ts';

describe('#date()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	describe('invalid dates', () => {
		[
			//TODO "date('1983-09-31')",
			{ expression: 'date("not a date")' },
			{ expression: 'date("opv_3")' },
			{ expression: 'date(true())' },
			//TODO "date(convertible())"
		].forEach(({ expression }) => {
			it(`should convert ${expression} to false`, () => {
				testContext.assertBooleanValue(expression, false);
				testContext.assertBooleanValue(expression.replace('date(', 'date-time('), false);
			});
		});
	});

	describe('valid date string', () => {
		describe('should be left alone', () => {
			[
				{ expression: 'date("1970-01-01")', expected: '1970-01-01' },
				{ expression: 'date("2018-01-01")', expected: '2018-01-01' },
				{ expression: '"2018-01-01"', expected: '2018-01-01' },
			].forEach(({ expression, expected }) => {
				it(`should convert ${expression} to ${expected}`, () => {
					testContext.assertStringValue(expression, expected);
				});
			});
		});

		describe('dates as number', () => {
			it('example 1', () => {
				testContext.assertNumberRounded('"2018-01-01" + 1', 17533.29167, 100000);
			});

			it('example 2', () => {
				testContext.assertNumberRounded('date("1970-01-01T00:00:00.000+00:00")', 0, 100000);
			});

			it('example 3', () => {
				testContext.assertNumberRounded('date(0)', 0, 100000);
			});

			describe('with explicit number() call', () => {
				it('example 1', () => {
					testContext.assertNumberRounded('number("2018-01-01" + 1)', 17533.29167, 100000);
				});
			});
		});

		describe('dates as string', () => {
			it('example 1', () => {
				testContext.assertStringValue('"2018-01-01"', '2018-01-01');
			});
			it('example 2', () => {
				testContext.assertStringValue('date("2018-01-01")', '2018-01-01');
			});
			it('example 3', () => {
				testContext.assertStringValue('date("2018-01-01" + 1)', '2018-01-02');
			});
			it('example 4', () => {
				testContext.assertStringValue('"2021-11-30" + 1', '18962.291666666668'); // correctness of decimals tbd later
			});
			it('example 5', () => {
				testContext.assertStringValue('"2021-11-30" - "2021-11-29"', '1');
			});
			it('example 6', () => {
				testContext.assertStringValue(
					'date(decimal-date-time("2003-10-20T08:00:00.000-07:00"))',
					'2003-10-20T08:00:00.000-07:00'
				);
			});

			['today()', 'date(today() + 10)', 'date(10 + today())'].forEach((expr) => {
				it(`should convert ${expr} to a date string`, () => {
					testContext.assertStringMatches(expr, /([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
				});
			});

			describe('with explicit string() call', () => {
				it('example 1', () => {
					testContext.assertStringValue('string("2018-01-01")', '2018-01-01');
				});
				it('example 2', () => {
					testContext.assertStringValue('string(date("2018-01-01"))', '2018-01-01');
				});
				it('example 3', () => {
					testContext.assertStringValue('string(date("2018-01-01" + 1))', '2018-01-02');
				});

				['string(today())', 'string(date(today() + 10))', 'string(date(10 + today()))'].forEach(
					(expr) => {
						it(`should convert ${expr} to a date string`, () => {
							testContext.assertStringMatches(expr, /([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
						});
					}
				);
			});
		});
	});

	describe('date string with single-digit day or month values', () => {
		it('should insert zeroes', () => {
			testContext.assertStringValue('date("1970-1-2")', '1970-01-02');
		});
	});

	describe('number', () => {
		[
			{ expression: 'date(0)', expected: '1969-12-31T17:00:00.000-07:00' },
			{ expression: 'date(1)', expected: '1970-01-01T17:00:00.000-07:00' },
			{ expression: 'date(1.5)', expected: '1970-01-02T05:00:00.000-07:00' },
			{ expression: 'date(-1)', expected: '1969-12-30T17:00:00.000-07:00' },
		].forEach(({ expression, expected }) => {
			it(expression + ' should be converted to ' + expected, () => {
				testContext.assertStringValue(expression, expected);
			});
		});
	});

	describe('invalid date', () => {
		["'nonsense'", "number('invalid')"].forEach((expression) => {
			it(`should not parse ${expression}, but instead should return "Invalid Date"`, () => {
				testContext.assertStringValue(`date(${expression})`, 'Invalid Date');
			});
		});

		it('should not parse an empty string, but instead should return an empty string', () => {
			testContext.assertStringValue("date('')", '');
		});
	});

	describe('comparisons', () => {
		[
			{ expression: 'date("2001-12-26") > date("2001-12-25")', expected: true },
			{ expression: 'date("2001-12-26") < date("2001-12-25")', expected: false },
			{ expression: 'date("1969-07-20") < date("1969-07-21")', expected: true },
			{ expression: 'date("1969-07-20") > date("1969-07-21")', expected: false },
			{ expression: 'date("2004-05-01") = date("2004-05-01")', expected: true },
			{ expression: 'date("2004-05-01") != date("2004-05-01")', expected: false },
			{ expression: '"string" != date("1999-09-09")', expected: true },
			{ expression: '"string" = date("1999-09-09")', expected: false },
			{ expression: 'date(0) = date("1970-01-01T00:00:00.000Z")', expected: true },
			{ expression: 'date(0) != date("1970-01-01T00:00:00.000Z")', expected: false },
			{ expression: 'date(1) = date("1970-01-02T00:00:00.000Z")', expected: true },
			{ expression: 'date(1) != date("1970-01-02T00:00:00.000Z")', expected: false },
			{ expression: 'date(-1) = date("1969-12-31T00:00:00.000Z")', expected: true },
			{ expression: 'date(-1) != date("1969-12-31T00:00:00.000Z")', expected: false },
			{ expression: 'date(14127) = date("2008-09-05T00:00:00.000Z")', expected: true },
			{ expression: 'date(14127) != date("2008-09-05T00:00:00.000Z")', expected: false },
			{ expression: 'date(-10252) = date("1941-12-07T00:00:00.000Z")', expected: true },
			{ expression: 'date(-10252) != date("1941-12-07T00:00:00.000Z")', expected: false },
			{ expression: 'date("2012-01-01") < today()', expected: true },
			{ expression: 'date("2012-01-01") > today()', expected: false },
			{ expression: 'date("2100-01-02") > today()', expected: true },
			{ expression: 'date("2100-01-02") < today()', expected: false },
			{ expression: 'date("2100-01-02") > 1', expected: true },
			{ expression: 'date("1970-01-02") < 3', expected: true },
		].forEach(({ expression, expected }) => {
			it("should evaluate '" + expression + "' to: " + expected, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('math', () => {
		[
			{ expression: 'date("2001-12-26") + 5', expected: '11687.291666666666' },
			{ expression: 'date("2001-12-26") - 5', expected: '11677.291666666666' },
			{ expression: '5 + date("2001-12-26")', expected: '11687.291666666666' },
			{ expression: '-5 + date("2001-12-26")', expected: '11677.291666666666' },
			{ expression: '3 + date("2001-12-26") + 5', expected: '11690.291666666666' },
			{ expression: '3 + date("2001-12-26") - 5', expected: '11680.291666666666' },
		].forEach(({ expression, expected }) => {
			it("should evaluate '" + expression + "' to: " + expected, () => {
				testContext.assertStringValue(expression, expected);
			});
		});
	});

	it('should convert now() to a date string with time component', () => {
		testContext.assertStringMatches(
			'now()',
			/([0-9]{4}-[0-9]{2}-[0-9]{2})([T]|[\s])([0-9]){2}:([0-9]){2}([0-9:.]*)(\+|-)([0-9]{2}):([0-9]{2})$/
		);
	});

	describe('converts dates to numbers', () => {
		[
			{ expression: "number(date('1970-01-01'))", expected: 0.29 },
			{ expression: "number(date('1970-01-02'))", expected: 1.29 },
			{ expression: "number(date('1969-12-31'))", expected: -0.71 },
			{ expression: "number(date('2008-09-05'))", expected: 14127.29 },
			{ expression: "number(date('1941-12-07'))", expected: -10251.71 },
			{ expression: "number('2008-09-05')", expected: 14127.29 },
			{ expression: 'number(1 div 1000000000 )', expected: 0 },
		].forEach(({ expression, expected }) => {
			it(`should convert ${expression} to ${expected}`, () => {
				testContext.assertNumberRounded(expression, expected, 100);
			});
		});
	});

	describe('for nodes (where the date datatype is guessed)', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(
				`
        <div id="FunctionDate">
          <div id="FunctionDateCase1">2012-07-23</div>
          <div id="FunctionDateCase2">2012-08-20T00:00:00.00+00:00</div>
          <div id="FunctionDateCase3">2012-08-08T00:00:00+00:00</div>
          <div id="FunctionDateCase4">2012-06-23</div>
          <div id="FunctionDateCase5">2012-08-08T06:07:08.123-07:00</div>
        </div>`,
				{ namespaceResolver }
			);
		});

		[
			{ expression: '.', id: 'FunctionDateCase1', expected: 15544.29 },
			{ expression: '.', id: 'FunctionDateCase2', expected: 15572 },
		].forEach(({ expression, id, expected }) => {
			it(`should convert ${expression} on ${id} to ${expected}`, () => {
				const contextNode = testContext.document.getElementById(id);

				testContext.assertNumberRounded(expression, expected, 100, {
					contextNode,
				});
			});
		});
	});

	describe('datetype comparisons', () => {
		[
			{ expression: "date('2001-12-26') > date('2001-12-25')", expected: true },
			{ expression: "date('1969-07-20') < date('1969-07-21')", expected: true },
			{ expression: "date('2004-05-01') = date('2004-05-01')", expected: true },
			{ expression: "true() != date('1999-09-09T00:00:00.000+00:00')", expected: false },
			{ expression: "date(0) = date('1970-01-01T00:00:00.000+00:00')", expected: true },
			{ expression: "date(1) = date('1970-01-02T00:00:00.000+00:00')", expected: true },
			{ expression: "date(-1) = date('1969-12-31T00:00:00.000+00:00')", expected: true },
			{ expression: "date(14127) = date('2008-09-05T00:00:00.000+00:00')", expected: true },
			{ expression: "date(-10252) = date('1941-12-07T00:00:00.000+00:00')", expected: true },
			{ expression: "date(date('1989-11-09')) = date('1989-11-09')", expected: true },
			{ expression: "date('2012-01-01') < today()", expected: true },
			{ expression: "date('2100-01-02') > today()", expected: true },
			{ expression: "date('2012-01-01') < now()", expected: true },
			{ expression: "date('2100-01-02') > now()", expected: true },
			// { expression: "now() > today()", expected: true },
			{ expression: '"2018-06-25" = "2018-06-25T00:00:00.000-07:00"', expected: false },
			{ expression: '"2018-06-25" < "2018-06-25T00:00:00.000-07:00"', expected: false },
			{ expression: '"2018-06-25" < "2018-06-25T00:00:00.001-07:00"', expected: true },
		].forEach(({ expression, expected }) => {
			it(`should convert ${expression} to ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);

				// do the same tests for the alias date-time()
				expression = expression.replace('date(', 'date-time(');
				testContext.assertBooleanValue(expression, expected);
			});
		});

		// Enketo supports bare strings as as date[time]s in this comparison, but per PR
		// feedback this is actually expected to evaluate to false.
		it.fails('evaluates string literals as date[time] values', () => {
			const expression = '"2018-06-25" = "2018-06-25T00:00:00.000-07:00"';
			const expected = true;

			testContext.assertBooleanValue(expression, expected);
		});
	});

	describe('datestring comparisons (date detection)', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`
        <div id="FunctionDate">
          <div id="FunctionDateCase1">2012-07-23</div>
          <div id="FunctionDateCase2">2012-08-20T00:00:00.00+00:00</div>
          <div id="FunctionDateCase3">2012-08-08T00:00:00+00:00</div>
          <div id="FunctionDateCase4">2012-06-23</div>
          <div id="FunctionDateCase5">2012-08-08T06:07:08.123-07:00</div>
        </div>`);
		});

		[
			{ expression: ". < date('2012-07-24')", id: 'FunctionDateCase1', expected: true },
			//returns false if strings are compared but true if dates are compared
			{
				expression: "../node()[@id='FunctionDateCase2'] > ../node()[@id='FunctionDateCase3']",
				id: 'FunctionDateCase1',
				expected: true,
			},
		].forEach(({ expression, expected, id }) => {
			it(`should convert ${expression} to ${expected}`, () => {
				const contextNode = testContext.document.getElementById(id);

				testContext.assertBooleanValue(expression, expected, {
					contextNode,
				});

				expression = expression.replace('date(', 'date-time(');
				testContext.assertBooleanValue(expression, expected, {
					contextNode,
				});
			});
		});
	});

	describe('date calculations', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(
				`
        <!DOCTYPE html>
        <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>xpath-test</title>
          </head>
          <body>
            <div id="FunctionDate">
              <div id="FunctionDateCase1">2012-07-23</div>
              <div id="FunctionDateCase4">2012-06-23</div>
            </div>
          </body>
        </html>`,
				{ namespaceResolver }
			);
		});

		[
			{ expression: "today() > ('2012-01-01' + 10)", id: null, expected: true },
			{ expression: "10 + date('2012-07-24') = date('2012-08-03')", id: null, expected: true },
			{ expression: ". = date('2012-07-24') - 1", id: 'FunctionDateCase1', expected: true },
			{ expression: ". > date('2012-07-24') - 2", id: 'FunctionDateCase1', expected: true },
			{ expression: ". < date('2012-07-25') - 1", id: 'FunctionDateCase1', expected: true },
			{
				expression:
					". = 30 + /xhtml:html/xhtml:body/xhtml:div[@id='FunctionDate']/xhtml:div[@id='FunctionDateCase4']",
				id: 'FunctionDateCase1',
				expected: true,
			},
			{ expression: "10 + '2012-07-24' = '2012-08-03'", id: null, expected: true },
		].forEach(({ expression, expected, id }) => {
			it(`should convert ${expression} to ${expected}`, () => {
				const contextNode =
					id == null ? testContext.document : testContext.document.getElementById(id);

				testContext.assertBooleanValue(expression, expected, {
					contextNode,
				});

				// do the same tests for the alias date-time()
				testContext.assertBooleanValue(expression.replace('date(', 'date-time('), expected, {
					contextNode,
				});
			});
		});

		[{ expression: '10 + date("2012-07-24")', expected: 15555.29 }].forEach(
			({ expression, expected }) => {
				it(`should convert ${expression} to ${expected}`, () => {
					testContext.assertNumberRounded(expression, expected, 100);

					// do the same tests for the alias date-time()
					testContext.assertNumberRounded(expression.replace('date(', 'date-time('), expected, 100);
				});
			}
		);
	});
});
