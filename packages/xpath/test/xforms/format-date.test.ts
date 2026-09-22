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
    // TODO: this should fail according to spec because we're passing 'time' identifiers into format-date
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
  describe('valid dates', () => {
    ['format-date', 'format-date-time'].forEach((fn) => {
      describe(fn, () => {
        [
          { value: '2017-05-26T00:00:01-07:00', format: '%a %b', expected: 'Fri May' },
          { value: '2017-05-26T23:59:59-07:00', format: '%a %b', expected: 'Fri May' },
          { value: '2017-05-26T01:00:00-07:00', format: '%a %b', expected: 'Fri May' },
          { value: '2012-08-20T00:00:00.00+00:00', format: '%Y-%m-%d', expected: '2012-08-19' },
          { value: '2026-12-12', format: '%Y-%m-%d', expected: '2026-12-12' },
          { value: '2026-12-01T10:30Z', format: '%Y-%m-%d', expected: '2026-12-01' },
          // TODO vimago test the language
          // { value: '2017-05-26T01:00:00-07:00', format: '%a %b', expected: 'ven. mai', language: 'fr' },
          // { value: '2017-05-26T01:00:00-07:00', format: '%a %b', expected: 'vr mei', language: 'nl' },
        ].forEach(({ value, format, expected }) => {
          const expression = `${fn}("${value}", "${format}")`;
          it(`evaluates ${expression} to ${expected}`, () => {
            testContext.assertStringValue(expression, expected);
          });
        });
      });
    });
  });

  describe('invalid dates', () => {
    [
      "format-date('invalid', '%e | %a' )",
      "format-date('2026-12-01T25:00:00.000Z', '%e | %a' )", // 25 hours
      "format-date('2026-12-01T25:00:00.000+10:00', '%e | %a' )", // 25 hours
      "format-date('2026-13-01', '%e | %a' )", // 13 months
      "format-date(number('invalid'), '%Y-%m-%d')", // not a number
      "format-date('2026-04-31T23:00:00+12:00', '%Y-%m-%d')", // there aren't 31 days in April
      "format-date-time('2026-02-29T10:00:00Z', '%Y-%m-%d %H:%M')", // there aren't 29 days in February non leap year
      "format-date('2026-12-01T24:00:00Z', '%Y-%m-%d')", // there aren't 24 hours in a day
      "format-date('26-12-12', '%Y-%m-%d')", // ambiguous year
    ].forEach((expr) => {
      it(`handles ${expr}`, () => {
        testContext.assertStringValue(expr, '');
      });
    });
  });
});
