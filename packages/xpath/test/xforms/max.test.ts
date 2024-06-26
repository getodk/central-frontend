import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('#max()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	[
		{ expression: 'max(1, 2, 3)', expected: 3 },
		{ expression: 'max(-1, -3, 0)', expected: 0 },
		{ expression: 'max(-1, 0, -3)', expected: 0 },
		{ expression: 'max(-4, -1, -3)', expected: -1 },
		{ expression: 'max("")', expected: NaN },
		{ expression: 'max(//nonexisting)', expected: NaN },
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertNumberValue(expression, expected);
		});
	});

	it('should return NaN if no numerical nodes are matched', () => {
		testContext = createXFormsTextContentTestContext('');

		testContext.assertNumberValue('max(/simple)', NaN);
	});

	it('should return value of a single node if only one matches', () => {
		testContext = createXFormsTextContentTestContext('3');

		testContext.assertNumberValue('max(/simple/xpath/to/node)', 3);
	});

	it('should return NaN if any node evaluates to NaN', () => {
		testContext = createXFormsTestContext(`
      <root>
        <item>3</item>
        <item>17</item>
        <item>-32</item>
        <item>cheese</item>
      </root>`);

		testContext.assertNumberValue('max(/root/item)', NaN);
	});

	it('should return the max value in a node set', () => {
		testContext = createXFormsTestContext(`
      <root>
        <item>3</item>
        <item>17</item>
        <item>-32</item>
      </root>`);

		testContext.assertNumberValue('max(/root/item)', 17);
	});

	it('should return the max value in a node set of negative numbers', () => {
		testContext = createXFormsTestContext(`
      <root>
        <item>-3</item>
        <item>-17</item>
        <item>-32</item>
      </root>`);

		testContext.assertNumberValue('max(/root/item)', -3);
	});

	it('max(self::*) & max(*)', () => {
		testContext = createXFormsTestContext(`
      <root>
        <div id="FunctionMaxCase">
          <div>-5</div>
          <div>0</div>
          <div>-15</div>
          <div>-10</div>
        </div>
        <div id="FunctionMaxMinCaseEmpty"></div>
        <div id="FunctionMaxMinWithEmpty">
          <div>-5</div>
          <div>-15</div>
          <div></div>
        </div>
      </root>`);

		let contextNode = testContext.document.getElementById('FunctionMaxMinCaseEmpty');

		testContext.assertNumberValue('max(self::*)', NaN, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionMaxCase');

		testContext.assertNumberValue('max(*)', 0, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionMaxMinWithEmpty');

		testContext.assertNumberValue('max(*)', NaN, {
			contextNode,
		});
	});

	it('max(self::*) & max(*)', () => {
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
      </div>`);

		let contextNode = testContext.document.getElementById('FunctionNumberCaseNumber');

		testContext.assertNumberValue('max(self::*)', 123, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionNumberCaseNumberMultiple');

		testContext.assertNumberValue('max(*)', 99, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionNumberCaseNotNumberMultiple');

		testContext.assertNumberValue('max(node())', NaN, {
			contextNode,
		});

		testContext.assertNumberValue('max(//nonexisting)', NaN);
	});
});
