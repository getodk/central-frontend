import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, namespaceResolver } from '../helpers.ts';

describe('native boolean functions', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	describe('boolean() conversion of booleans', () => {
		[
			{ expression: "boolean('a')", expected: true },
			{ expression: "boolean('')", expected: false },
			{ expression: 'boolean(true())', expected: true },
			{ expression: 'boolean(false())', expected: false },
		].forEach(({ expression, expected }) => {
			it(`evaluates ${expression} to ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('boolean() conversion of numbers', () => {
		[
			{ expression: 'boolean(1)', expected: true },
			{ expression: 'boolean(-1)', expected: true },
			{ expression: 'boolean(1 div 0)', expected: true },
			{ expression: 'boolean(0.1)', expected: true },
			{ expression: "boolean('0.0001')", expected: true },
			{ expression: 'boolean(0)', expected: false },
			{ expression: 'boolean(0.0)', expected: false },
			{ expression: "boolean(number(''))", expected: false },
		].forEach(({ expression, expected }) => {
			it(`evaluates ${expression} to ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('boolean() conversion of nodeset', () => {
		beforeEach(() => {
			testContext = createTestContext(
				`
        <!DOCTYPE html>
        <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>xpath-test</title>
          </head>
          <body class="yui3-skin-sam" id="body">
          </body>
        </html>`,
				{ namespaceResolver }
			);
		});

		[
			{ expression: 'boolean(/xhtml:html)', expected: true },
			{ expression: 'boolean(/asdf)', expected: false },
			{ expression: 'boolean(//xhtml:article)', expected: false },
		].forEach(({ expression, expected }) => {
			it(`evaluates ${expression} to ${expected}`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	it('boolean(self::node())', () => {
		testContext = createTestContext(`
      <root>
        <div id="FunctionBooleanEmptyNode">
          <div></div>
        </div>
      </root>`);

		const contextNode = testContext.document.getElementById('FunctionBooleanEmptyNode');

		testContext.assertBooleanValue('boolean(self::node())', true, {
			contextNode,
		});
	});

	it.fails('boolean() fails when too few arguments are provided', () => {
		testContext.evaluate('boolean()');
	});

	it.fails('boolean() fails when too many arguments are provided', () => {
		testContext.evaluate('boolean(1, 2)');
	});
});
