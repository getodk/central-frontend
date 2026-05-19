import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#sum()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('sum(self::*)', () => {
		testContext = createXFormsTestContext(`
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
        <div id="FunctionSumCaseJavarosa">
          <div>-10</div>
          <div>15</div>
          <div></div>
        </div>
      </div>`);
		const { document } = testContext;

		let contextNode = document.getElementById('FunctionNumberCaseNumberMultiple');

		testContext.assertNumberValue('sum(*)', 100, {
			contextNode,
		});

		contextNode = document.getElementById('FunctionNumberCaseNumber');

		testContext.assertNumberValue('sum(self::*)', 123, {
			contextNode,
		});

		contextNode = document.getElementById('FunctionNumberCaseNotNumberMultiple');

		testContext.assertNumberValue('sum(node())', NaN, {
			contextNode,
		});
	});

	it('sum(*)', () => {
		testContext = createXFormsTestContext(`
      <root id="root">
        <item>-10</item>
        <item>11</item>
        <item>99</item>
      </root>`);

		const contextNode = testContext.document.getElementById('root');

		testContext.assertNumberValue('sum(*)', 100, { contextNode });
		testContext.assertNumberValue('sum(/root/item)', 100);
	});

	it.fails('sum() fails when too many arguments are provided', () => {
		testContext.evaluate('sum(1, 2)');
	});

	it.fails('sum() fails when too few arguments are provided', () => {
		testContext.evaluate('sum()');
	});
});
