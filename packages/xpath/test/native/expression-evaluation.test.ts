import { beforeEach, describe, expect, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, getNonNamespaceAttributes, namespaceResolver } from '../helpers.ts';

describe('XPath expression evaluation', () => {
	let testContext: TestContext;
	let document: XMLDocument;

	beforeEach(() => {
		testContext = createTestContext(`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="XPathExpressionEvaluateCase">
            <div id="testContextNodeParameter" style="display:block;">
              <div id="testContextNodeParameterText">some text</div>
              <div id="testContextNodeParameterCData"><![CDATA[aa<strong>some text</strong>]]></div>
              <div id="testContextNodeParameterComment"><!-- here is comment --></div>
              <div id="testContextNodeParameterProcessingInstruction"><?xml-stylesheet type="text/xml" href="test.xsl"?></div>
              <div id="testContextNodeParameterNamespace" xmlns:asdf="http://some-namespace/"></div>
            </div>
          </div>
        </body>
      </html>`);
		document = testContext.document;
	});

	it('works with different types of context parameters', () => {
		[
			{ expression: '.', contextNode: document, nodeType: 9 }, // Document
			{ expression: '.', contextNode: document.documentElement, nodeType: 1 }, // Element
			{
				expression: '.',
				contextNode: document.getElementById('testContextNodeParameter')!,
				nodeType: 1,
			}, // Element
			{
				expression: '.',
				contextNode: getNonNamespaceAttributes(
					document.getElementById('testContextNodeParameter')!
				)[0]!,
				nodeType: 2,
			}, // Attribute
			{
				expression: '.',
				contextNode: document.getElementById('testContextNodeParameterText')!.firstChild!,
				nodeType: 3,
			}, // Text
			{
				expression: '.',
				contextNode: document.getElementById('testContextNodeParameterCData')!.firstChild!,
				nodeType: 4,
			}, // CDATASection
			{
				expression: '.',
				contextNode: document.getElementById('testContextNodeParameterProcessingInstruction')!
					.firstChild!,
				nodeType: 7,
			}, // ProcessingInstruction
			{
				expression: '.',
				contextNode: document.getElementById('testContextNodeParameterComment')!.firstChild!,
				nodeType: 8,
			}, // Comment
		].forEach(({ expression, contextNode, nodeType }) => {
			expect(contextNode.nodeType).toEqual(nodeType);

			const result = testContext.evaluate(
				expression,
				contextNode,
				XPathResult.ANY_UNORDERED_NODE_TYPE
			);

			expect(result.singleNodeValue).toEqual(contextNode);
		});
	});

	it('works with different context parameter namespaces', () => {
		// get a namespace node
		const contextNode = document.getElementById('testContextNodeParameterNamespace')!;

		//TODO let result = xEval("namespace::node()", node, XPathResult.ANY_UNORDERED_NODE_TYPE);
		let result = testContext.evaluate('.', contextNode, XPathResult.ANY_UNORDERED_NODE_TYPE);

		const item = result.singleNodeValue;

		expect(item).not.toBeNull();

		//TODO chrome/firefox do not support namespace:node()
		// assert.equal(item.nodeType, 13);

		// use namespacenode as a context node
		result = testContext.evaluate('.', item, XPathResult.ANY_UNORDERED_NODE_TYPE);

		expect(result.singleNodeValue).toEqual(item);
	});

	it.fails('fails if the context is document fragment', () => {
		testContext.evaluate(
			'.',
			document.createDocumentFragment(),
			XPathResult.ANY_UNORDERED_NODE_TYPE,
			null
		);
	});
});

describe('XPath expression evaluation3', () => {
	it('works with expected return type', () => {
		const testContext = createTestContext(`<model>
        <instance>
          <nested_repeats id="nested_repeats">
            <formhub><uuid/></formhub>
            <kids>
              <has_kids>1</has_kids>
            </kids>
          </nested_repeats>
        </instance>
      </model>`);

		let expression = `/model/instance[1]/nested_repeats/kids/has_kids='1'`;
		let result = testContext.evaluate(expression, null, XPathResult.BOOLEAN_TYPE);

		expect(result.resultType).toEqual(3);
		expect(result.booleanValue).toEqual(true);

		expression = `/model/instance[1]/nested_repeats/kids/has_kids='2'`;
		result = testContext.evaluate(expression, null, 3);

		expect(result.resultType).toEqual(3);
		expect(result.booleanValue).toEqual(false);
	});
});

describe('XPath expression evaluation4', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext(`<thedata id="thedata">
      <nodeA/>
      <nodeB>b</nodeB>
      </thedata>`);
	});

	[
		{ expression: '/thedata/nodeA', expected: true },
		{ expression: '/thedata/nodeB', expected: true },
		{ expression: '/thedata/nodeC', expected: false },
	].forEach(({ expression, expected }) => {
		it('returns correct result type', () => {
			const res = testContext.evaluate(expression, null, XPathResult.BOOLEAN_TYPE);

			expect(res.resultType).toEqual(3);
			expect(res.booleanValue).toEqual(expected);
		});
	});
});

describe('XPath expression evaluation5', () => {
	it('returns correct result type', () => {
		const testContext = createTestContext(
			`
      <html xmlns="http://www.w3.org/2002/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:h="http://www.w3.org/1999/xhtml"
        xmlns:jr="http://openrosa.org/javarosa"
        xmlns:orx="http://openrosa.org/xforms/" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
      <model>
        <instance>
          <data id="nested-repeat-v5">
            <region jr:template="">
              <livestock jr:template="">
                <type/>
                <type_other/>
              </livestock>
            </region>
            <meta>
              <instanceID/>
            </meta>
          </data>
        </instance>
      </model></html>`,
			{ namespaceResolver }
		);

		const expression = '/model/instance[1]/*//*[@template] | /model/instance[1]/*//*[@jr:template]';

		const result = testContext.evaluate(expression, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);

		expect(result.resultType).toEqual(7);
		expect(result.snapshotLength).toEqual(0);
	});
});
