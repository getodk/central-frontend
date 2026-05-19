import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, namespaceResolver, getNonNamespaceAttributes } from '../helpers.ts';

describe('location path', () => {
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
          <div id="LocationPathCase">
            <div id="LocationPathCaseText">some text</div>
            <div id="LocationPathCaseComment"><!-- some comment --></div>
            <div id="LocationPathCaseCData"><![CDATA[some cdata]]></div>
            <div id="LocationPathCaseProcessingInstruction"><?xml-stylesheet type="text/xml" href="test.xsl"?></div>
            <div id="LocationPathCaseAttribute" class="123" width="100%"></div>
            <div id="LocationPathCaseNamespace" xmlns:asdf="http://www.123.com/"></div>

            <div id="LocationPathCaseDuplicates"></div>

            <div id="LocationPathCaseAttributeParent"><div attr="aa"></div><div attr="aa3a" attr2="sss"></div><div attr2="adda"></div><div attr4="aa"></div></div>

            <div id="LocationPathCaseNamespaceParent"><div xmlns="http://asdss/"></div><div xmlns:aa="http://saa/" xmlns:a2="hello/world" xmlns:ab="hello/world2"></div><div></div><div xmlns:aa="http://saa/"></div></div>
          </div>
        </body>
      </html>`,
			{ namespaceResolver }
		);

		document = testContext.document;
	});

	it('root', () => {
		const input = [
			{
				contextNode: document,
				expected: [document],
			}, // Document
			{
				contextNode: document.documentElement,
				expected: [document],
			}, // Element
			{
				contextNode: document.getElementById('LocationPathCase')!,
				expected: [document],
			}, // Element
			{
				contextNode: document.getElementById('LocationPathCaseText')!.firstChild!,
				expected: [document],
			}, // Text
			{
				contextNode: document.getElementById('LocationPathCaseComment')!.firstChild!,
				expected: [document],
			}, // Comment
			{
				contextNode: document.getElementById('LocationPathCaseProcessingInstruction')!.firstChild!,
				expected: [document],
			}, // ProcessingInstruction
			{
				contextNode: document.getElementById('LocationPathCaseCData')!.firstChild!,
				expected: [document],
			}, // CDataSection
			// [filterAttributes(doc.getElementById('LocationPathCaseAttribute').attributes)[0], [doc]] // Attribute
		];

		input.forEach(({ contextNode, expected }) => {
			testContext.assertNodeSet('/', expected, {
				contextNode,
			});
		});
	});

	it('root node', () => {
		testContext.assertNodeSet('/html', []);
		testContext.assertNodeSet('/xhtml:html', [document.documentElement]);

		const contextNode = document.getElementById('LocationPathCase')!;

		testContext.assertNodeSet('/xhtml:html', [document.documentElement], {
			contextNode,
		});
		testContext.assertNodeSet('/htmlnot', [], {
			contextNode,
		});
	});

	it('root node node', () => {
		const contextNode = document.getElementById('LocationPathCase')!;

		testContext.assertNodeSet('/xhtml:html/xhtml:body', [document.querySelector('body')!], {
			contextNode,
		});
	});

	it('node (node)', () => {
		testContext.assertNodeSet('html', []);
		testContext.assertNodeSet('xhtml:html', [document.documentElement]);
		testContext.assertNodeSet('xhtml:html/xhtml:body', [document.querySelector('body')!]);
	});

	it('node attribute', () => {
		const contextNode = document.getElementById('LocationPathCaseAttributeParent')!;

		testContext.assertNodeSet(
			'child::*/attribute::*',
			[
				getNonNamespaceAttributes(contextNode.children[0]!)[0]!,
				getNonNamespaceAttributes(contextNode.children[1]!)[0]!,
				getNonNamespaceAttributes(contextNode.children[1]!)[1]!,
				getNonNamespaceAttributes(contextNode.children[2]!)[0]!,
				getNonNamespaceAttributes(contextNode.children[3]!)[0]!,
			],
			{
				contextNode,
			}
		);
	});

	it('duplicates handled correctly', () => {
		const contextNode = document.getElementById('LocationPathCaseDuplicates')!;

		testContext.assertNodeSet(
			'ancestor-or-self::* /ancestor-or-self::*',
			[
				document.documentElement,
				document.querySelector('body')!,
				document.getElementById('LocationPathCase')!,
				document.getElementById('LocationPathCaseDuplicates')!,
			],
			{
				contextNode,
			}
		);
	});
});
