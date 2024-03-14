import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#position()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('position(node) with an argument', () => {
		testContext = createXFormsTestContext(`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="node1"/>
          <div id="node2"/>
          <div id="node3"/>
          <div id="node4"/>
          <div id="node5"/>
          <div id="FunctionNumberCase">
            <div id="FunctionNumberCaseNumber">123</div>
            <div id="FunctionNumberCaseNotNumber">  a a  </div>
            <div id="FunctionNumberCaseNumberMultiple">
              <div>-10</div>
              <div>11</div>
              <div>99</div>
            </div>
            <div id="FunctionNumberCaseNotNumberMultiple">
              <div>-10</div>
              <div>11</div>
              <div>a</div>
            </div>
          </div>
        </body>
      </html>`);

		const contextNode = testContext.document.getElementById('FunctionNumberCaseNumberMultiple');

		testContext.assertNumberValue('position(..)', 6, {
			contextNode,
		});
		testContext.assertNumberValue('position(.)', 3, {
			contextNode,
		});
	});

	it('position(node) with p node', () => {
		testContext = createXFormsTestContext(`
      <div id="testFunctionNodeset">
        <div id="testFunctionNodeset2">
          <p>1</p>
          <p>2</p>
          <p>3</p>
          <p>4</p>
        </div>
        <div id="testFunctionNodeset3">
          <div>
            <p>1</p>
          </div>
          <div>
            <p id="testFunctionNodeset3NodeP">2</p>
          </div>
          <div>
            <p>3</p>
          </div>
          <div>
            <p>4</p>
          </div>
        </div>
      </div>`);

		const contextNode = testContext.document.getElementById('testFunctionNodeset3NodeP');

		testContext.assertNumberValue('position(../..)', 2, {
			contextNode,
		});
	});
	//   throw new Error('nodeset provided to position() contained multiple nodes');
});
