import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, namespaceResolver } from '../helpers.ts';

describe('count-non-empty', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('count-non-empty', () => {
		testContext = createXFormsTestContext(
			`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="FunctionCountNonEmpty">
            <div>-5</div>
            <div>-15</div>
            <div></div>
            <p>
              <div></div>
              <div><!--comment--></div>
              <span>  </span>
              <span>
              </span>
            </p>
            <p></p>
           </div>
          </body>
        </html>`,
			{ namespaceResolver }
		);

		testContext.assertNumberValue(
			'count-non-empty(//xhtml:div[@id="FunctionCountNonEmpty"]/xhtml:div)',
			2
		);
		testContext.assertNumberValue(
			'count-non-empty(//xhtml:div[@id="FunctionCountNonEmpty"]/xhtml:p)',
			1
		);
		testContext.assertNumberValue(
			'count-non-empty(//xhtml:div[@id="FunctionCountNonEmpty"]/xhtml:p/xhtml:div)',
			0
		);
		testContext.assertNumberValue(
			'count-non-empty(//xhtml:div[@id="FunctionCountNonEmpty"]/xhtml:p/xhtml:span)',
			2
		);
		testContext.assertNumberValue(
			'count-non-empty(//xhtml:div[@id="FunctionCountNonEmpty"]//*)',
			5
		);
		testContext.assertNumberValue('count-non-empty(//xhtml:div[@id="NoExist"]/xhtml:div)', 0);
	});

	[
		{ expression: 'count-non-empty()' },
		{ expression: 'count-non-empty(2)' },
		{ expression: 'count-non-empty(0)' },
		{ expression: 'count-non-empty("a")' },
	].forEach(({ expression }) => {
		it.fails(
			`${expression} fails when too few, too many, or incorrect arguments are provided`,
			() => {
				testContext.evaluate(expression);
			}
		);
	});
});
