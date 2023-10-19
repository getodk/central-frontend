import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('native string functions', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('string() conversion of strings, numbers, booleans', () => {
		testContext.assertStringValue("string('-1.0')", '-1.0');
		testContext.assertStringValue("string('1')", '1');
		testContext.assertStringValue("string('  \nhello \n\r')", '  \nhello \n\r');
		testContext.assertStringValue("string('')", '');
		testContext.assertStringValue("string('As Df')", 'As Df');

		// of numbers
		// assertString("string(number('-1.0a'))", "NaN");
		testContext.assertStringValue('string(0)', '0');
		testContext.assertStringValue('string(-0)', '0');
		testContext.assertStringValue('string(1 div 0)', 'Infinity');
		testContext.assertStringValue('string(-1 div 0)', '-Infinity');
		testContext.assertStringValue('string(-123)', '-123');
		testContext.assertStringValue('string(123)', '123');
		testContext.assertStringValue('string(123.)', '123');
		testContext.assertStringValue('string(123.0)', '123');
		testContext.assertStringValue('string(.123)', '0.123');
		testContext.assertStringValue('string(-0.1000)', '-0.1');
		testContext.assertStringValue('string(1.1)', '1.1');
		testContext.assertStringValue('string(-1.1)', '-1.1');

		// of booleans
		testContext.assertStringValue('string(true())', 'true');
		testContext.assertStringValue('string(false())', 'false');
	});

	describe('string() conversion of nodesets', () => {
		beforeEach(() => {
			testContext = createTestContext(`
        <div id="FunctionStringCase">
          <div id="FunctionStringCaseStringNodesetElement">aaa</div>
          <div id="FunctionStringCaseStringNodesetElementNested"><span>bbb</span>sss<span></span><div>ccc<span>ddd</span></div></div>
          <div id="FunctionStringCaseStringNodesetComment"><!-- hello world --></div>
          <div id="FunctionStringCaseStringNodesetText">here is some text</div>
          <div id="FunctionStringCaseStringNodesetProcessingInstruction"><?xml-stylesheet type="text/xml" href="test.xsl"?></div>
          <div id="FunctionStringCaseStringNodesetCData"><![CDATA[some cdata]]></div>
          <div id="FunctionStringCaseStringNodesetAttribute" class="123" width="  1   00%  "></div>
          <div id="FunctionStringCaseStringNodesetNamespace" xmlns:asdf="http://www.123.com/"></div>
          <div id="FunctionStringCaseStringLength1"></div>
          <div id="FunctionStringCaseStringLength2">asdf</div>
          <div id="FunctionStringCaseStringNormalizeSpace1"></div>
          <div id="FunctionStringCaseStringNormalizeSpace2">   </div>
          <div id="FunctionStringCaseStringNormalizeSpace3">  a  b  </div>
          <div id="FunctionStringCaseStringNormalizeSpace4">  a
            bc  c
          </div>
        </div>`);
		});

		const input = [
			{ expression: 'string(/htmlnot)', expected: '' }, // empty
			{
				expression: 'string(self::node())',
				id: 'FunctionStringCaseStringNodesetElement',
				expected: 'aaa',
			}, // element
			{ expression: 'string()', id: 'FunctionStringCaseStringNodesetElement', expected: 'aaa' }, // element
			{
				expression: 'string(node())',
				id: 'FunctionStringCaseStringNodesetElementNested',
				expected: 'bbb',
			}, // element nested
			{
				expression: 'string(self::node())',
				id: 'FunctionStringCaseStringNodesetElementNested',
				expected: 'bbbssscccddd',
			}, // element nested
			{
				expression: 'string()',
				id: 'FunctionStringCaseStringNodesetElementNested',
				expected: 'bbbssscccddd',
			}, // element nested
			{
				expression: 'string()',
				parentId: 'FunctionStringCaseStringNodesetComment',
				expected: ' hello world ',
			}, // comment
			{
				expression: 'string()',
				parentId: 'FunctionStringCaseStringNodesetText',
				expected: 'here is some text',
			}, // text
			{
				expression: 'string(attribute::node()[1])',
				id: 'FunctionStringCaseStringNodesetAttribute',
				expected: 'FunctionStringCaseStringNodesetAttribute',
			}, // attribute
			{
				expression: 'string(attribute::node()[3])',
				id: 'FunctionStringCaseStringNodesetAttribute',
				expected: '  1   00%  ',
			}, // attribute
			{
				expression: 'string()',
				parentId: 'FunctionStringCaseStringNodesetProcessingInstruction',
				expected: 'type="text/xml" href="test.xsl"',
			}, // processing instruction
			{
				expression: 'string()',
				parentId: 'FunctionStringCaseStringNodesetCData',
				expected: 'some cdata',
			}, // CDataSection
		];

		input.forEach(({ expression, id, parentId, expected }) => {
			it(`should convert ${expression} to ${expected}`, () => {
				const { document } = testContext;
				let contextNode: Node = document;

				if (id != null) {
					contextNode = document.getElementById(id)!;
				}

				if (parentId != null) {
					contextNode = document.getElementById(parentId)!.firstChild!;
				}

				testContext.assertStringValue(expression, expected, {
					contextNode,
				});
			});
		});
	});

	it('string conversion of nodeset with namespace', () => {
		testContext = createTestContext(`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="FunctionStringCaseStringNodesetNamespace" xmlns:asdf="http://www.123.com/"></div>
        </body>
      </html>`);

		const contextNode = testContext.document.getElementById(
			'FunctionStringCaseStringNodesetNamespace'
		);

		testContext.assertStringValue('string(namespace-uri(/*))', 'http://www.w3.org/1999/xhtml', {
			contextNode,
		});
	});

	it.fails('string conversion fails when too many arguments are provided', () => {
		testContext.evaluate('string(1, 2)');
	});

	it('concat()', () => {
		testContext.assertStringValue('concat(0, 0)', '00');
		testContext.assertStringValue("concat('', '', 'b')", 'b');
		testContext.assertStringValue("concat('a', '', 'c')", 'ac');
		testContext.assertStringValue("concat('a', 'b', 'c', 'd', 'e')", 'abcde');
	});

	it('starts-with', () => {
		testContext.assertBooleanValue("starts-with('', '')", true);
		testContext.assertBooleanValue("starts-with('a', '')", true);
		testContext.assertBooleanValue("starts-with('a', 'a')", true);
		testContext.assertBooleanValue("starts-with('a', 'b')", false);
		testContext.assertBooleanValue("starts-with('ba', 'b')", true);
		testContext.assertBooleanValue("starts-with('', 'b')", false);
	});

	it.fails('starts-with() fails when too many arguments are provided', () => {
		testContext.evaluate('starts-with(1, 2, 3)');
	});

	[{ expression: 'starts-with()' }, { expression: 'starts-with(1)' }].forEach(({ expression }) => {
		it.fails(`${expression} fails when not enough arguments are provided`, () => {
			testContext.evaluate(expression);
		});
	});

	it('contains()', () => {
		testContext.assertBooleanValue("contains('', '')", true);
		testContext.assertBooleanValue("contains('', 'a')", false);
		testContext.assertBooleanValue("contains('a', 'a')", true);
		testContext.assertBooleanValue("contains('a', '')", true);
		testContext.assertBooleanValue("contains('asdf', 'sd')", true);
		testContext.assertBooleanValue("contains('asdf', 'af')", false);
	});

	it.fails('contains() fails when too many arguments are provided', () => {
		testContext.evaluate('contains(1, 2, 3)');
	});

	[{ expression: 'contains()' }, { expression: 'contains(1)' }].forEach(({ expression }) => {
		it.fails(`${expression} fails when too few arguments are provided`, () => {
			testContext.evaluate(expression);
		});
	});

	it('substring-before()', () => {
		testContext.assertStringValue("substring-before('', '')", '');
		testContext.assertStringValue("substring-before('', 'a')", '');
		testContext.assertStringValue("substring-before('a', '')", '');
		testContext.assertStringValue("substring-before('a', 'a')", '');
		testContext.assertStringValue("substring-before('ab', 'a')", '');
		testContext.assertStringValue("substring-before('ab', 'b')", 'a');
		testContext.assertStringValue("substring-before('abb', 'b')", 'a');
		testContext.assertStringValue("substring-before('ab', 'c')", '');
	});

	it.fails('substring-before() fails with too many arguments', () => {
		testContext.evaluate('substring-before(1, 2, 3)');
	});

	[{ expression: 'substring-before()' }, { expression: 'substring-before(1)' }].forEach(
		({ expression }) => {
			it.fails(`${expression} with too few arguments`, () => {
				testContext.evaluate(expression);
			});
		}
	);

	it('substring-after()', () => {
		testContext.assertStringValue("substring-after('', '')", '');
		testContext.assertStringValue("substring-after('', 'a')", '');
		testContext.assertStringValue("substring-after('a', '')", 'a');
		testContext.assertStringValue("substring-after('a', 'a')", '');
		testContext.assertStringValue("substring-after('ab', 'a')", 'b');
		testContext.assertStringValue("substring-after('aab', 'a')", 'ab');
		testContext.assertStringValue("substring-after('ab', 'b')", '');
		testContext.assertStringValue("substring-after('ab', 'c')", '');
	});

	it.fails('substring-after() fails when too many arguments are provided', () => {
		testContext.evaluate('substring-after(1, 2, 3)');
	});

	[{ expression: 'substring-after()' }, { expression: 'substring-after(1)' }].forEach(
		({ expression }) => {
			it.fails(`${expression} fails when too few arguments are provided`, () => {
				testContext.evaluate(expression);
			});
		}
	);

	describe('substring()', () => {
		[
			{ expression: "substring('12345', 2, 3)", expected: '234' },
			{ expression: "substring('12345', 2)", expected: '2345' },
			{ expression: "substring('12345', -1)", expected: '12345' },
			{ expression: "substring('12345', 1 div 0)", expected: '' },
			{ expression: "substring('12345', 0 div 0)", expected: '' },
			{ expression: "substring('12345', -1 div 0)", expected: '12345' }, // this diverges from Firefox and Chrome implementations, but seems to follow the spec
			{ expression: "substring('12345', 1.5, 2.6)", expected: '234' },
			{ expression: "substring('12345', 1.3, 2.3)", expected: '12' },
			{ expression: "substring('12345', 0, 3)", expected: '12' },
			{ expression: "substring('12345', 0, -1 div 0)", expected: '' },
			{ expression: "substring('12345', 0 div 0, 3)", expected: '' },
			{ expression: "substring('12345', 1, 0 div 0)", expected: '' },
			{ expression: "substring('12345', -42, 1 div 0)", expected: '12345' },
			{ expression: "substring('12345', -1 div 0, 1 div 0)", expected: '' },
		].forEach(({ expression, expected }) => {
			it(`should evaluate "${expression}" to "${expected}"`, () => {
				testContext.assertStringValue(expression, expected);
			});
		});
	});

	it.fails('substring() fails when too many arguments are provided', () => {
		testContext.evaluate('substring(1, 2, 3, 4)');
	});

	[{ expression: 'substring()' }, { expression: 'substring(1)' }].forEach(({ expression }) => {
		it.fails(`${expression} fails when too few arguments are provided`, () => {
			testContext.evaluate(expression);
		});
	});

	it('string-length()', () => {
		testContext = createTestContext(`
      <div>
        <div id="FunctionStringCaseStringLength1"></div>
        <div id="FunctionStringCaseStringLength2">asdf</div>
      </div>`);

		[
			{ expression: "string-length('')", expected: 0 },
			{ expression: "string-length(' ')", expected: 1 },
			{ expression: "string-length('\r\n')", expected: 2 },
			{ expression: "string-length('a')", expected: 1 },
			{ expression: 'string-length()', id: 'FunctionStringCaseStringLength1', expected: 0 },
			{ expression: 'string-length()', id: 'FunctionStringCaseStringLength2', expected: 4 },
		].forEach(({ expression, id, expected }) => {
			const contextNode =
				id == null ? testContext.document : testContext.document.getElementById(id);

			testContext.assertNumberValue(expression, expected, {
				contextNode,
			});
		});
	});

	it.fails('string-length() fails when too many arguments are provided', () => {
		testContext.evaluate('string-length(1, 2)');
	});

	describe('normalize-space()', () => {
		beforeEach(() => {
			testContext = createTestContext(`
        <div>
          <div id="FunctionStringCaseStringNormalizeSpace1"></div>
          <div id="FunctionStringCaseStringNormalizeSpace2">   </div>
          <div id="FunctionStringCaseStringNormalizeSpace3">  a  b  </div>
          <div id="FunctionStringCaseStringNormalizeSpace4">  a
            bc  c
          </div>
        </div>`);
		});

		[
			{ expression: "normalize-space('')", expected: '' },
			{ expression: "normalize-space('    ')", expected: '' },
			{ expression: "normalize-space('  a')", expected: 'a' },
			{ expression: "normalize-space('  a  ')", expected: 'a' },
			{ expression: "normalize-space('  a b  ')", expected: 'a b' },
			{ expression: "normalize-space('  a  b  ')", expected: 'a b' },
			{ expression: "normalize-space(' \r\n\t')", expected: '' },
			{ expression: "normalize-space(' \f\v ')", expected: '\f\v' },
			{ expression: "normalize-space('\na  \f \r\v  b\r\n  ')", expected: 'a \f \v b' },
			{
				expression: 'normalize-space()',
				id: 'FunctionStringCaseStringNormalizeSpace1',
				expected: '',
			},
			{
				expression: 'normalize-space()',
				id: 'FunctionStringCaseStringNormalizeSpace2',
				expected: '',
			},
			{
				expression: 'normalize-space()',
				id: 'FunctionStringCaseStringNormalizeSpace3',
				expected: 'a b',
			},
			{
				expression: 'normalize-space()',
				id: 'FunctionStringCaseStringNormalizeSpace4',
				expected: 'a bc c',
			},
		].forEach(({ expression, id, expected }) => {
			it(`should evaluate ${expression} to ${expected}`, () => {
				const contextNode =
					id == null ? testContext.document : testContext.document.getElementById(id);

				testContext.assertStringValue(expression, expected, {
					contextNode,
				});
			});
		});
	});

	it.fails('normalize-space() fails when too many arguments are provided', () => {
		testContext.evaluate('normalize-space(1,2)');
	});

	it('translate()', () => {
		[
			{ expression: "translate('', '', '')", expected: '' },
			{ expression: "translate('a', '', '')", expected: 'a' },
			{ expression: "translate('a', 'a', '')", expected: '' },
			{ expression: "translate('a', 'b', '')", expected: 'a' },
			{ expression: "translate('ab', 'a', 'A')", expected: 'Ab' },
			{ expression: "translate('ab', 'a', 'AB')", expected: 'Ab' },
			{ expression: "translate('aabb', 'ab', 'ba')", expected: 'bbaa' },
			{ expression: "translate('aa', 'aa', 'bc')", expected: 'bb' },
		].forEach(({ expression, expected }) => {
			testContext.assertStringValue(expression, expected);
		});
	});

	it('translate() with a node parameter', () => {
		testContext = createTestContext(`
      <div>
        <a id="A">TAXIcab</a>
      </div>`);

		const contextNode = testContext.document.getElementById('A');

		testContext.assertStringValue('translate( ., "abc", "ABC")', 'TAXICAB', {
			contextNode,
		});
	});

	it.fails('translate() fails when too many arguments are provided', () => {
		testContext.evaluate('translate(1, 2, 3, 4)');
	});

	[
		{ expression: 'translate()' },
		{ expression: 'translate(1)' },
		{ expression: 'translate(1, 2)' },
	].forEach(({ expression }) => {
		it.fails(`${expression} fails when too few arguments are provided`, () => {
			testContext.evaluate(expression);
		});
	});
});
