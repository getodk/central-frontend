import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#selected-at()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	[
		{ from: 'zero one two three', index: 1, expected: 'one' },
		{ from: 'zero one two three', index: 4, expected: '' },
		{ from: 'zero one two three', index: -1, expected: '' },
		{ from: '', index: 0, expected: '' },
	].forEach(({ from, index, expected }) => {
		it(`should select ${expected} from "${from}" at index ${index}`, () => {
			testContext.assertStringValue(`selected-at('${from}', '${index}')`, expected);
		});
	});

	it('simple', () => {
		testContext.assertStringValue('selected-at("apple baby crimson", 2)', 'crimson');
		testContext.assertStringValue('selected-at("apple baby crimson", -1)', '');
		testContext.assertStringValue('selected-at("", 1)', '');
	});

	it('with nodes', () => {
		testContext = createXFormsTestContext(`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="FunctionSelectedCase">
            <div id="FunctionSelectedCaseEmpty"></div>
            <div id="FunctionSelectedCaseSingle">ab</div>
            <div id="FunctionSelectedCaseMultiple">ab cd ef gh</div>
            <div id="FunctionSelectedCaseMultiple">ij</div>
          </div>
        </body>
      </html>`);
		const { document } = testContext;

		let contextNode = document.getElementById('FunctionSelectedCaseEmpty');

		testContext.assertStringValue('selected-at(self::node(), 0)', '', {
			contextNode,
		});

		contextNode = document.getElementById('FunctionSelectedCaseSingle');

		testContext.assertStringValue('selected-at(self::node(), 0)', 'ab', {
			contextNode,
		});

		contextNode = document.getElementById('FunctionSelectedCaseSingle');

		testContext.assertStringValue('selected-at(self::node(), 1)', '', {
			contextNode,
		});

		contextNode = document.getElementById('FunctionSelectedCaseMultiple');

		testContext.assertStringValue('selected-at(self::node(), 2)', 'ef', {
			contextNode,
		});
		testContext.assertStringValue('selected-at(self::node(), -1)', '', {
			contextNode,
		});
	});
});
