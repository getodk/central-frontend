import { beforeEach, describe, expect, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, getNonNamespaceAttributes, namespaceResolver } from '../helpers.ts';

describe('node name for', () => {
	let testContext: TestContext;
	let document: XMLDocument;

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
          <div id="StepNodeTestCaseNameTest">
            <div id="StepNodeTestCaseNameTestAttribute" ev:attrib1="value" ev:attrib2="value2" xml:attrib2="something" xml:sss="something2" attrib3="asdf" xmlns:ns2="http://asdf/" ns2:attrib4="Hello world"></div>
            <div id="StepNodeTestCaseNameTestNamespace" xmlns:ns1="test-123" xmlns:ns2="http://asdf/" ev:attrib1="value" xml:attrib2="something" attrib3="asdf"></div>
            <div id="StepNodeTestCaseNameTestChild"><div xmlns="http://asdf/"></div><ev:div xmlns:ev="http://asdf/"></ev:div><ev:span xmlns:ev="http://asdf/"></ev:span>
              <div></div>
              asdf
              <!-- asdf -->
              asdf
              <div></div>

              <div></div>
              asas
              <div></div>
            </div>

            <div id="StepNodeTestCaseNameTest1">
              <div id="StepNodeTestCaseNameTest2">
                <div id="StepNodeTestCaseNameTest3"></div>
              </div>
            </div>

            <div id="StepNodeTestCaseNameTestNoNamespace"><div xmlns=""><div><div></div></div></div></div>
          </div>
        </body>
      </html>`,
			{ namespaceResolver }
		);
		document = testContext.document;
	});

	it('any attribute', () => {
		const contextNode = document.getElementById('StepNodeTestCaseNameTestAttribute')!;

		testContext.assertNodeSet('attribute::*', getNonNamespaceAttributes(contextNode), {
			contextNode,
		});
	});

	it('any child', () => {
		const contextNode = document.getElementById('StepNodeTestCaseNameTestChild')!;

		testContext.assertNodeSet('child::*', Array.from(contextNode.children), {
			contextNode,
		});
	});

	it('any ancestor-or-self', () => {
		const element = document.getElementById('StepNodeTestCaseNameTestAttribute')!;
		const attributes = getNonNamespaceAttributes(element);
		const contextNode = attributes[0]!;

		testContext.assertNodeSet(
			'ancestor-or-self::*',
			[
				document.documentElement,
				document.querySelector('body')!,
				document.getElementById('StepNodeTestCaseNameTest')!,
				document.getElementById('StepNodeTestCaseNameTestAttribute')!,
			],
			{
				contextNode,
			}
		);
	});

	it('attribute with a specific name', () => {
		const contextNode = document.getElementById('StepNodeTestCaseNameTestAttribute')!;
		const attribute = getNonNamespaceAttributes(contextNode).find(
			(attr) => attr.localName === 'attrib3'
		);

		expect(attribute).not.toBeNull();
		testContext.assertNodeSet('attribute::attrib3', [attribute!], {
			contextNode,
		});
	});

	[
		{ expression: 'child::html', expectedSelectors: [] },
		{ expression: 'child::xhtml:html', expectedSelectors: [':root'] },
	].forEach(({ expression, expectedSelectors }) => {
		it(`child with specific (namespaced) name (expression: ${expression}`, () => {
			const expected = expectedSelectors.flatMap((selector) =>
				Array.from(document.querySelectorAll(selector))
			);

			testContext.assertNodeSet(expression, expected);
		});
	});

	it('ancestor with specific name and namespace', () => {
		const contextNode = document.getElementById('StepNodeTestCaseNameTest3')!;

		testContext.assertNodeSet(
			'ancestor::xhtml:div',
			[
				document.getElementById('StepNodeTestCaseNameTest')!,
				document.getElementById('StepNodeTestCaseNameTest1')!,
				document.getElementById('StepNodeTestCaseNameTest2')!,
			],
			{
				contextNode,
			}
		);
	});

	it('ancestor with specific name without a default namespace', () => {
		const contextNode = document.getElementById('StepNodeTestCaseNameTestNoNamespace')!.firstChild!
			.firstChild!.firstChild!;

		testContext.assertNodeSet(
			'ancestor::div',
			[
				document.getElementById('StepNodeTestCaseNameTestNoNamespace')!.firstChild!,
				document.getElementById('StepNodeTestCaseNameTestNoNamespace')!.firstChild!.firstChild!,
			],
			{
				contextNode,
			}
		);
	});
});
