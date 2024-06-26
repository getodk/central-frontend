import { beforeEach, expect, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, namespaceResolver } from '../helpers.ts';

describe('native nodeset functions', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	describe('last()', () => {
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
            <div id="testFunctionNodeset">
              <div id="testFunctionNodeset2">
                <p>1</p>
                <p>2</p>
                <p>3</p>
                <p>4</p>
              </div>
            </div>
          </body>
        </html>`,
				{ namespaceResolver }
			);
		});

		[
			{ expression: 'last()', expected: 1 },
			{ expression: 'xhtml:p[last()]', expected: 4 },
			{ expression: 'xhtml:p[last()-last()+1]', expected: 1 },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				// given
				const contextNode = testContext.document.getElementById('testFunctionNodeset2');

				// expect
				testContext.assertNumberValue(expression, expected, {
					contextNode,
				});
			});
		});
	});

	it.fails('last() fails when too many arguments are provided', () => {
		testContext.evaluate('last(1)');
	});

	describe('position()', () => {
		let contextNode: Node;

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
            <div id="testFunctionNodeset">
              <div id="testFunctionNodeset2">
                <p>1</p>
                <p>2</p>
                <p>3</p>
                <p>4</p>
              </div>
            </div>
          </body>
        </html>`,
				{ namespaceResolver }
			);

			contextNode = testContext.document.getElementById('testFunctionNodeset2')!;
		});
		[
			{ expression: 'position()', expected: 1 },
			{ expression: '*[position()=last()]', expected: 4 },
			{ expression: '*[position()=2]', expected: 2 },
			//[ "xhtml:p[position()=2]", 2 ] TODO unresolvable namespace here...
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext.assertNumberValue(expression, expected, {
					contextNode,
				});
			});
		});

		[{ expression: '*[position()=-1]', expected: '' }].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext.assertStringValue(expression, expected, {
					contextNode,
				});
			});
		});

		it.fails('position() fails when arg is not a nodeset', () => {
			testContext.evaluate('position(1)');
		});
	});

	describe('count()', () => {
		[
			{ expression: 'count(xhtml:p)', expected: 4 },
			{ expression: '1 + count(xhtml:p)', expected: 5 },
			{ expression: 'count(p)', expected: 0 },
			{ expression: '1 + count(p)', expected: 1 },
			{ expression: 'count(//nonexisting)', expected: 0 },
			{ expression: '1 + count(//nonexisting)', expected: 1 },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' to ${expected}`, () => {
				// given
				testContext = createTestContext(
					`
          <!DOCTYPE html>
          <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
            <head>
              <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
              <title>xpath-test</title>
            </head>
            <body class="yui3-skin-sam" id="body">
              <div id="testFunctionNodeset">
                <div id="testFunctionNodeset2">
                  <p>1</p>
                  <p>2</p>
                  <p>3</p>
                  <p>4</p>
                </div>
              </div>
            </body>
          </html>`,
					{ namespaceResolver }
				);

				const contextNode = testContext.document.getElementById('testFunctionNodeset2');

				// expect
				testContext.assertNumberValue(expression, expected, {
					contextNode,
				});
			});
		});

		it.fails('count() fails when too many arguments are provided', () => {
			testContext.evaluate('count(1, 2)');
		});

		it.fails('count() fails when too few arguments are provided', () => {
			testContext.evaluate('count()');
		});

		it.fails('count() fails when incorrect argument type is provided', () => {
			testContext.evaluate('count(1)');
		});
	});

	const localNameInput = [
		{ expression: 'local-name(/htmlnot)', expected: '' }, // empty
		{ expression: 'local-name()', expected: '' }, // document
		{ expression: 'local-name()', id: 'root', expected: 'html' }, // element
		{ expression: 'local-name(self::node())', id: 'testFunctionNodesetElement', expected: 'div' }, // element
		{ expression: 'local-name()', id: 'testFunctionNodesetElement', expected: 'div' }, // element
		{ expression: 'local-name()', parentId: 'testFunctionNodesetElementPrefix', expected: 'div2' }, // element
		{ expression: 'local-name(node())', id: 'testFunctionNodesetElementNested', expected: 'span' }, // element nested
		{
			expression: 'local-name(self::node())',
			id: 'testFunctionNodesetElementNested',
			expected: 'div',
		}, // element nested
		{ expression: 'local-name()', parentId: 'testFunctionNodesetComment', expected: '' }, // comment
		{ expression: 'local-name()', parentId: 'testFunctionNodesetText', expected: '' }, // text
		{
			expression: 'local-name(attribute::node())',
			id: 'testFunctionNodesetAttribute',
			expected: 'id',
		}, // attribute
		{
			expression: `local-name(attribute::node()[2])`,
			id: 'testFunctionNodesetAttribute',
			expected: 'class',
		}, // attribute
		{
			expression: 'local-name()',
			parentId: 'testFunctionNodesetProcessingInstruction',
			expected: 'xml-stylesheet',
		}, // processing instruction
		{ expression: 'local-name()', parentId: 'testFunctionNodesetCData', expected: '' }, // CDATASection
	];

	localNameInput.forEach(({ expression, id, parentId, expected }) => {
		let contextLabel: string;

		if (id != null) {
			contextLabel = `(context: #${id})`;
		} else if (parentId != null) {
			contextLabel = `(context: #${parentId} first child)`;
		} else {
			contextLabel = `(context: document)`;
		}

		it(`${expression} ${contextLabel}`, () => {
			testContext = createTestContext(
				`
        <!DOCTYPE html>
        <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss" id="root">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>xpath-test</title>
          </head>
          <body class="yui3-skin-sam" id="body">
            <div id="testFunctionNodeset">
              <div id="testFunctionNodesetElement">aaa</div>
              <div id="testFunctionNodesetElementPrefix"><ev:div2></ev:div2></div>
              <div id="testFunctionNodesetElementNested"><span>bbb</span>sss<span></span><div>ccc<span>ddd</span></div></div>
              <div id="testFunctionNodesetComment"><!-- hello world --></div>
              <div id="testFunctionNodesetText">here is some text</div>
              <div id="testFunctionNodesetProcessingInstruction"><?xml-stylesheet type="text/xml" href="test.xsl"?></div>
              <div id="testFunctionNodesetCData"><![CDATA[some cdata]]></div>
              <div id="testFunctionNodesetAttribute" ev:class="123" width="  1   00%  "></div>
              <div id="testFunctionNodesetNamespace" xmlns:asdf="http://www.123.com/"></div>
            </div>
          </body>
        </html>`,
				{ namespaceResolver }
			);

			let contextNode: Node | null = null;

			if (parentId != null) {
				contextNode = testContext.document.getElementById(parentId)!.firstChild!;
			}

			if (id != null) {
				contextNode = testContext.document.getElementById(id)!;
			}

			const { stringValue } = testContext.evaluate(
				expression,
				contextNode,
				XPathResult.STRING_TYPE
			);

			expect(stringValue.toLowerCase()).toEqual(expected);
		});
	});

	it('local-name() with namespace', () => {
		testContext = createTestContext(
			`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="testFunctionNodesetNamespace" xmlns:asdf="http://www.123.com/"></div>
        </body>
      </html>`,
			{ namespaceResolver }
		);

		const contextNode = testContext.document.getElementById('testFunctionNodesetNamespace')!;
		[
			{ expression: 'local-name(namespace::node())', expected: '' },
			//TODO ["local-name(namespace::node()[2])", node, "asdf"]
		].forEach(({ expression, expected }) => {
			// const val = doc.e(expr, node, nsr, XPathResult.STRING_TYPE, null);
			// assert.equal(val.stringValue, expected);
			testContext.assertStringValue(expression, expected, {
				contextNode,
			});
		});
	});

	it.fails('local-name() fails when too many arguments are provided', () => {
		testContext.evaluate('local-name(1, 2)');
	});

	it.fails('local-name() fails when the wrong type argument is provided', () => {
		testContext.evaluate('local-name(1)');
	});

	const namespaceURIInput = [
		{ expression: 'namespace-uri(/htmlnot)', expected: '' }, // empty
		{ expression: 'namespace-uri()', expected: '' }, // document
		{ expression: 'namespace-uri()', id: 'root', expected: 'http://www.w3.org/1999/xhtml' }, // element
		{
			expression: 'namespace-uri(self::node())',
			id: 'testFunctionNodesetElement',
			expected: 'http://www.w3.org/1999/xhtml',
		}, // element
		{
			expression: 'namespace-uri()',
			id: 'testFunctionNodesetElement',
			expected: 'http://www.w3.org/1999/xhtml',
		}, // element
		{
			expression: 'namespace-uri(node())',
			id: 'testFunctionNodesetElementNested',
			expected: 'http://www.w3.org/1999/xhtml',
		}, // element nested
		{
			expression: 'namespace-uri(self::node())',
			id: 'testFunctionNodesetElementNested',
			expected: 'http://www.w3.org/1999/xhtml',
		}, // element nested
		{
			expression: 'namespace-uri()',
			parentId: 'testFunctionNodesetElementPrefix',
			expected: 'http://some-namespace.com/nss',
		}, // element
		{ expression: 'namespace-uri()', parentId: 'testFunctionNodesetComment', expected: '' }, // comment
		{ expression: 'namespace-uri()', parentId: 'testFunctionNodesetText', expected: '' }, // text
		{
			expression: 'namespace-uri(attribute::node())',
			id: 'testFunctionNodesetAttribute',
			expected: '',
		}, // attribute
		{
			expression: `namespace-uri(attribute::node()[2])`,
			id: 'testFunctionNodesetAttribute',
			expected: 'http://some-namespace.com/nss',
		}, // attribute
		{
			expression: 'namespace-uri(namespace::node())',
			id: 'testFunctionNodesetNamespace',
			expected: '',
		}, // namespace
		{
			expression: 'namespace-uri(namespace::node()[2])',
			id: 'testFunctionNodesetNamespace',
			expected: '',
		}, // namespace
		{
			expression: 'namespace-uri()',
			parentId: 'testFunctionNodesetProcessingInstruction',
			expected: '',
		}, // processing instruction
		{ expression: 'namespace-uri()', parentId: 'testFunctionNodesetCData', expected: '' }, // CDATASection
	];

	namespaceURIInput.forEach(({ expression, id, parentId, expected }) => {
		let contextLabel: string;

		if (id != null) {
			contextLabel = `(context: #${id})`;
		} else if (parentId != null) {
			contextLabel = `(context: #${parentId} first child)`;
		} else {
			contextLabel = `(context: document)`;
		}

		it(`${expression} ${contextLabel}`, () => {
			testContext = createTestContext(
				`
        <!DOCTYPE html>
        <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss" id="root">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>xpath-test</title>
          </head>
          <body class="yui3-skin-sam" id="body">
            <div id="testFunctionNodeset">
              <div id="testFunctionNodesetElement">aaa</div>
              <div id="testFunctionNodesetElementPrefix"><ev:div2></ev:div2></div>
              <div id="testFunctionNodesetElementNested"><span>bbb</span>sss<span></span><div>ccc<span>ddd</span></div></div>
              <div id="testFunctionNodesetComment"><!-- hello world --></div>
              <div id="testFunctionNodesetText">here is some text</div>
              <div id="testFunctionNodesetProcessingInstruction"><?xml-stylesheet type="text/xml" href="test.xsl"?></div>
              <div id="testFunctionNodesetCData"><![CDATA[some cdata]]></div>
              <div id="testFunctionNodesetAttribute" ev:class="123" width="  1   00%  "></div>
              <div id="testFunctionNodesetNamespace" xmlns:asdf="http://www.123.com/"></div>
            </div>
          </body>
        </html>`,
				{ namespaceResolver }
			);

			let contextNode: Node | null = null;

			if (parentId != null) {
				contextNode = testContext.document.getElementById(parentId)!.firstChild!;
			}

			if (id != null) {
				contextNode = testContext.document.getElementById(id)!;
			}

			testContext.assertStringValue(expression, expected, {
				contextNode,
			});
		});
	});

	it.fails('namespace-uri() fails when too many arguments are provided', () => {
		testContext.evaluate('namespace-uri(1, 2)');
	});

	it.fails('namespace-uri() fails when wrong type of argument is provided', () => {
		testContext.evaluate('namespace-uri(1)');
	});

	const nameInput = [
		{ expression: 'name(/htmlnot)', expected: '' }, // empty
		{ expression: 'name()', expected: '' }, // document
		{ expression: 'name()', id: 'root', expected: 'html' }, // element
		{ expression: 'name(self::node())', id: 'testFunctionNodesetElement', expected: 'div' }, // element
		{ expression: 'name()', id: 'testFunctionNodesetElement', expected: 'div' }, // element
		{ expression: 'name(node())', id: 'testFunctionNodesetElementNested', expected: 'span' }, // element nested
		{ expression: 'name(self::node())', id: 'testFunctionNodesetElementNested', expected: 'div' }, // element nested
		{ expression: 'name()', parentId: 'testFunctionNodesetElementPrefix', expected: 'ev:div2' }, // element
		{ expression: 'name()', parentId: 'testFunctionNodesetComment', expected: '' }, // comment
		{ expression: 'name()', parentId: 'testFunctionNodesetText', expected: '' }, // text
		{ expression: 'name(attribute::node())', id: 'testFunctionNodesetAttribute', expected: 'id' }, // attribute
		{
			expression: `name(attribute::node()[2])`,
			id: 'testFunctionNodesetAttribute',
			expected: 'ev:class',
		}, // attribute
		{ expression: 'name(namespace::node())', id: 'testFunctionNodesetNamespace', expected: '' }, // namespace
		{
			expression: 'name()',
			parentId: 'testFunctionNodesetProcessingInstruction',
			expected: 'xml-stylesheet',
		}, // Processing Instruction
		{ expression: 'name()', parentId: 'testFunctionNodesetCData', expected: '' }, // CDataSection
		//TODO [ "name(namespace::node()[2])", doc.getElementById('testFunctionNodesetNamespace' ), "asdf" ] // namespace
	];

	nameInput.forEach(({ expression, id, parentId, expected }) => {
		let contextLabel: string;

		if (id != null) {
			contextLabel = `(context: #${id})`;
		} else if (parentId != null) {
			contextLabel = `(context: #${parentId} first child)`;
		} else {
			contextLabel = `(context: document)`;
		}

		it(`${expression} ${contextLabel}`, () => {
			testContext = createTestContext(
				`
        <!DOCTYPE html>
        <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss" id="root">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>xpath-test</title>
          </head>
          <body class="yui3-skin-sam" id="body">
            <div id="testFunctionNodeset">
              <div id="testFunctionNodesetElement">aaa</div>
              <div id="testFunctionNodesetElementPrefix"><ev:div2></ev:div2></div>
              <div id="testFunctionNodesetElementNested"><span>bbb</span>sss<span></span><div>ccc<span>ddd</span></div></div>
              <div id="testFunctionNodesetComment"><!-- hello world --></div>
              <div id="testFunctionNodesetText">here is some text</div>
              <div id="testFunctionNodesetProcessingInstruction"><?xml-stylesheet type="text/xml" href="test.xsl"?></div>
              <div id="testFunctionNodesetCData"><![CDATA[some cdata]]></div>
              <div id="testFunctionNodesetAttribute" ev:class="123" width="  1   00%  "></div>
              <div id="testFunctionNodesetNamespace" xmlns:asdf="http://www.123.com/"></div>
            </div>
          </body>
        </html>`,
				{ namespaceResolver }
			);

			let contextNode: Node | null = null;

			if (parentId != null) {
				contextNode = testContext.document.getElementById(parentId)!.firstChild!;
			}

			if (id != null) {
				contextNode = testContext.document.getElementById(id)!;
			}

			testContext.assertStringValue(expression, expected, {
				contextNode,
			});
		});
	});

	it.fails('name() fails when too many arguments are provided', () => {
		testContext.evaluate('name(1, 2)');
	});

	it.fails('name() fails when the wrong argument type is provided', () => {
		testContext.evaluate('name(1)');
	});

	describe('node() as part of a path', () => {
		beforeEach(() => {
			testContext = createTestContext(
				`
      <model xmlns:jr="http://openrosa.org/javarosa">
        <instance>
          <data id="nested-repeat-v5" jr:complete="1" complete="0">
            <node/>
          </data>
        </instance>
        </model>`,
				{ namespaceResolver }
			);
		});

		[
			{ expression: '/model/instance[1]/node()/@jr:complete = "1"', expected: true },
			{ expression: '/model/instance[1]/node()/@jr:complete = 1', expected: true },
			{ expression: '/model/instance[1]/node()/@complete = 0', expected: true },
			{ expression: '/model/instance[1]/node()/@complete = "0"', expected: true },
		].forEach(({ expression, expected }) => {
			it(`evaluates attribute value comparison (${expression}) correctly`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('"*" as part of a path', () => {
		beforeEach(() => {
			testContext = createTestContext(
				`
        <model xmlns:jr="http://openrosa.org/javarosa">
          <instance>
            <data id="nested-repeat-v5" jr:complete="1" complete="0">
              <node/>
            </data>
          </instance>
        </model>`,
				{ namespaceResolver }
			);
		});

		[
			{ expression: '/model/instance[1]/*/@jr:complete = "1"', expected: true },
			{ expression: '/model/instance[1]/*/@jr:complete = 1', expected: true },
			{ expression: '/model/instance[1]/*/@complete = 0', expected: true },
			{ expression: '/model/instance[1]/*/@complete = "0"', expected: true },
		].forEach(({ expression, expected }) => {
			it(`evaluates attribute value comparison (${expression}) correctly`, () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});
});
