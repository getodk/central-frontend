import { beforeEach, describe, expect, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, namespaceResolver } from '../helpers.ts';

describe('randomize()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	describe('called on a non-nodeset', () => {
		[{ expression: 'randomize(1, 2)' }].forEach(({ expression }) => {
			it.fails(`should evaluate '${expression}' as ___TODO___`, () => {
				testContext.evaluate(expression);
			});
		});
	});

	const SELECTOR = '//xhtml:div[@id="FunctionRandomize"]/xhtml:div';

	describe('shuffles nodesets', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(
				`
        <!DOCTYPE html>
        <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>xpath-test</title>
          </head>
          <body class="yui3-skin-sam" id="body">
            <div id="FunctionRandomize">
              <div>A</div>
              <div>B</div>
              <div>C</div>
              <div>D</div>
              <div>E</div>
              <div>F</div>
            </div>
            <div id="testFunctionNodeset2">
              <p>1</p>
              <p>2</p>
              <p>3</p>
              <p>4</p>
            </div>
          </body>
        </html>`,
				{ namespaceResolver }
			);
		});

		it(
			'without a seed',
			() => {
				const expression = `randomize(${SELECTOR})`;

				testContext.assertBooleanValue(expression, true);

				const nodes = testContext.evaluateUnorderedNodeSet(expression);
				const text = nodes.map(({ textContent }) => textContent ?? '').join('');

				expect(nodes.length).toEqual(6);
				expect(text.length).toEqual(6);
				expect(text).not.toEqual('ABCDEF');
			},
			{ retry: 5 }
		);

		[
			{ seed: 42, expected: 'AFCBDE' },
			{ seed: '42', expected: 'AFCBDE' },
			{ seed: -42, expected: 'EDAFBC' },
			{ seed: 1, expected: 'BFEACD' },
			{ seed: 11111111, expected: 'ACDBFE' },
			{ seed: 'int(1)', expected: 'BFEACD' },
			{ seed: 'floor(1.1)', expected: 'BFEACD' },
			{ seed: '//xhtml:div[@id="testFunctionNodeset2"]/xhtml:p', expected: 'BFEACD' },
		].forEach(({ seed, expected }) => {
			it(`with a seed: ${seed}`, () => {
				const expression = `randomize(${SELECTOR}, ${seed})`;

				const nodes = testContext.evaluateUnorderedNodeSet(expression);
				const text = nodes.map(({ textContent }) => textContent ?? '').join('');

				expect(text).toEqual(expected);
			});
		});
	});

	[
		{ expression: 'randomize()' },
		{ expression: `randomize(${SELECTOR}, 'a')` },
		{ expression: `randomize(${SELECTOR}, 1, 2)` },
	].forEach(({ expression }) => {
		it.fails(`${expression} with invalid args, throws an error`, () => {
			testContext.evaluate(expression);
		});
	});

	it('randomizes nodes', () => {
		testContext = createXFormsTestContext(`
      <model>
          <instance>
              <rank id="rank">
                  <s1/>
                  <r1/>
                  <r2/>
                  <r3>foddertree beans cacao coffee foddergrass banana</r3>
                  <r4/>
                  <meta>
                      <instanceID/>
                  </meta>
              </rank>
          </instance>
          <instance id="crop_list">
              <root>
                  <item>
                      <label>Banana</label>
                      <name>banana</name>
                  </item>
                  <item>
                      <label>Beans</label>
                      <name>beans</name>
                  </item>
                  <item>
                      <label>Cacao</label>
                      <name>cacao</name>
                  </item>
                  <item>
                      <label>Coffee</label>
                      <name>coffee</name>
                  </item>
                  <item>
                      <label>Fodder Grass</label>
                      <name>foddergrass</name>
                  </item>
                  <item>
                      <label>Fodder Tree</label>
                      <name>foddertree</name>
                  </item>
              </root>
          </instance>
        </model>`);

		const expression = 'randomize(/model/instance[@id="crop_list"]/root/item)';
		const result = testContext.evaluate(expression, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);

		expect(result.resultType).toEqual(XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
		expect(result.snapshotLength).toEqual(6);
	});
});
