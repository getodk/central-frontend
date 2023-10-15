import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, createTextContentTestContext } from '../helpers.ts';

describe('#selected()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	[
		{ expression: 'selected(/simple/xpath/to/node, "one")', expected: true },
		{ expression: 'selected(/simple/xpath/to/node, "two")', expected: true },
		{ expression: 'selected(/simple/xpath/to/node, "three")', expected: true },
	].forEach(({ expression, expected }) => {
		it(`should return true if requested item is in list (evaluating ${expression})`, () => {
			// given
			testContext = createTextContentTestContext('one two three');

			testContext.assertBooleanValue(expression, expected);
		});
	});

	[
		{ expression: 'selected(/simple/xpath/to/node, "on")', expected: false },
		{ expression: 'selected(/simple/xpath/to/node, "ne")', expected: false },
		{ expression: 'selected(/simple/xpath/to/node, "four")', expected: false },
	].forEach(({ expression, expected }) => {
		it(`should return false if requested item not in list (evaluating ${expression})`, () => {
			// given
			testContext = createTextContentTestContext('one two three');

			testContext.assertBooleanValue(expression, expected);
		});
	});

	[
		{ expression: 'selected("apple baby crimson", "  baby  ")', expected: true },
		{ expression: 'selected("apple baby crimson", "apple")', expected: true },
		{ expression: 'selected("apple baby crimson", "baby")', expected: true },
		{ expression: 'selected("apple baby crimson", "crimson")', expected: true },
		{ expression: 'selected("apple baby crimson", "babby")', expected: false },
		{ expression: 'selected("apple baby crimson", "bab")', expected: false },
		{ expression: 'selected("apple", "apple")', expected: true },
		{ expression: 'selected("apple", "ovoid")', expected: false },
		{ expression: 'selected("", "apple")', expected: false },
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertBooleanValue(expression, expected);
		});
	});

	it('with nodes', () => {
		testContext = createTestContext(`
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

		testContext.assertBooleanValue('selected(self::node(), "")', true, {
			contextNode,
		});
		testContext.assertBooleanValue('selected(self::node(), "ab")', false, {
			contextNode,
		});

		contextNode = document.getElementById('FunctionSelectedCaseSingle');

		testContext.assertBooleanValue('selected(self::node(), "bc")', false, {
			contextNode,
		});
		testContext.assertBooleanValue('selected(self::node(), "ab")', true, {
			contextNode,
		});

		contextNode = document.getElementById('FunctionSelectedCaseMultiple');

		testContext.assertBooleanValue('selected(self::node(), "kl")', false, {
			contextNode,
		});
		testContext.assertBooleanValue('selected(self::node(), "ab")', true, {
			contextNode,
		});
		testContext.assertBooleanValue('selected(self::node(), "cd")', true, {
			contextNode,
		});
		testContext.assertBooleanValue('selected(self::node(), "ij")', false, {
			contextNode,
		});
	});
});
