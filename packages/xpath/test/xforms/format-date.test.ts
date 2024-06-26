import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#format-date()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	[
		{
			expression: 'format-date(.,  "%Y/%n | %y/%m | %b" )',
			id: 'FunctionDateCase1',
			expected: '2012/7 | 12/07 | Jul',
		},
		{
			expression: 'format-date(., "%Y/%n | %y/%m | %b" )',
			id: 'FunctionDateCase2',
			expected: '2012/8 | 12/08 | Aug',
		},
		// TODO: this should fail according to spec!
		{
			expression: 'format-date(., "%M | %S | %3")',
			id: 'FunctionDateCase2',
			expected: '00 | 00 | 000',
		},
		{ expression: 'format-date("not a date", "%M")', id: null, expected: '' },
	].forEach(({ expression, id, expected }) => {
		it(`evaluates ${expression} with context #${id} to ${expected}`, () => {
			testContext = createXFormsTestContext(`
        <div id="FunctionDate">
          <div id="FunctionDateCase1">2012-07-23</div>
          <div id="FunctionDateCase2">2012-08-20T00:00:00.00+00:00</div>
          <div id="FunctionDateCase3">2012-08-08T00:00:00+00:00</div>
          <div id="FunctionDateCase4">2012-06-23</div>
          <div id="FunctionDateCase5">2012-08-08T06:07:08.123-07:00</div>
        </div>`);
			const contextNode =
				id == null ? testContext.document : testContext.document.getElementById(id);

			testContext.assertStringValue(expression, expected, {
				contextNode,
			});
			// do the same tests for the alias format-date-time()
			testContext.assertStringValue(
				expression.replace('format-date', 'format-date-time'),
				expected,
				{ contextNode }
			);
		});
	});

	// Enketo supports this case. Per PR feedback, it is not expected to be
	// supported. "Or very useful, frankly!"
	it.fails('evaluates a localized/colloquial timestamp, as produced by the JS runtime', () => {
		const date = new Date();
		const expression = `format-date('${date.toString()}', '%e | %a' )`;
		const expected = `${date.getDate()} | ${
			['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
		}`;

		testContext.assertStringValue(expression, expected);
		testContext.assertStringValue(expression.replace('format-date', 'format-date-time'), expected);
	});

	// Config is setting timezone to America/Phoenix
	[
		{ expression: 'format-date("2017-05-26T00:00:01-07:00", "%a %b")', expected: 'Fri May' },
		{ expression: 'format-date("2017-05-26T23:59:59-07:00", "%a %b")', expected: 'Fri May' },
		{
			expression: 'format-date("2017-05-26T01:00:00-07:00", "%a %b")',
			expected: 'Fri May',
			language: 'en',
		},
		// ['format-date('2017-05-26T01:00:00-07:00', '%a %b')", 'ven. mai', 'fr'],
		// ['format-date('2017-05-26T01:00:00-07:00', '%a %b')", 'vr mei', 'nl'],
	].forEach(({ expression, expected /*, language*/ }) => {
		it(`evaluates ${expression} (locale dependent) to ${expected}`, () => {
			testContext.assertStringValue(expression, expected);
			// TODO vimago test the language
			// do the same tests for the alias format-date-time()
			expression = expression.replace('format-date', 'format-date-time');
			testContext.assertStringValue(expression, expected);
		});
	});

	it('format-date() - invalid input', () => {
		[{ expression: "''" }, { expression: "number('invalid')" }].forEach(({ expression }) => {
			testContext.assertStringValue(`format-date(${expression}, '%Y-%m-%d')`, '');
		});
	});
});
