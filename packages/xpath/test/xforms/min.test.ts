import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('#min()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	[
		{ expression: 'min(1, 2, 3)', expected: 1 },
		{ expression: 'min(1, 2, 0)', expected: 0 },
		{ expression: 'min(0, 2, 3)', expected: 0 },
		{ expression: 'min(-1, 2, 3)', expected: -1 },
		{ expression: 'min("")', expected: NaN },
		{ expression: 'min(//nonexisting)', expected: NaN },
	].forEach(({ expression, expected }) => {
		it(`evaluates ${expression} to ${expected}`, () => {
			testContext.assertNumberValue(expression, expected);
		});
	});

	it('should return NaN if no numerical nodes are matched', () => {
		testContext.assertNumberValue('min(/simple)', NaN);
	});

	it('should return value of a single node if only one matches', () => {
		testContext = createXFormsTextContentTestContext('3');

		testContext.assertNumberValue('min(/simple/xpath/to/node)', 3);
	});

	it('should return NaN if any node evaluates to NaN', () => {
		testContext = createXFormsTestContext(`
      <root>
        <item>3</item>
        <item>17</item>
        <item>-32</item>
        <item>cheese</item>
      </root>`);

		testContext.assertNumberValue('min(/root/item)', NaN);
	});

	it('should return the min value in a node set', () => {
		testContext = createXFormsTestContext(`
      <root>
        <item>3</item>
        <item>-17</item>
        <item>32</item>
      </root>`);

		testContext.assertNumberValue('min(/root/item)', -17);
	});

	it('should return the min value in a node set of negative numbers', () => {
		testContext = createXFormsTestContext(`
        <root>
          <item>-3</item>
          <item>-17</item>
          <item>-32</item>
        </root>`);

		testContext.assertNumberValue('min(/root/item)', -32);
	});

	it('min(self::*) & min(*)', () => {
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

		testContext.assertNumberValue('min(self::*)', 123, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionNumberCaseNumberMultiple');

		testContext.assertNumberValue('min(*)', -10, {
			contextNode,
		});
	});

	it('min()', () => {
		testContext = createXFormsTestContext(`
      <div>
        <div id="FunctionMinCase">
          <div>5</div>
          <div>0</div>
          <div>15</div>
          <div>10</div>
        </div>

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

      </div>`);

		let contextNode = testContext.document.getElementById('FunctionMaxMinCaseEmpty');

		testContext.assertNumberValue('min(self::*)', NaN, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionMaxMinWithEmpty');

		testContext.assertNumberValue('min(*)', NaN, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionMinCase');

		testContext.assertNumberValue('min(*)', 0, {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionNumberCaseNotNumberMultiple');

		testContext.assertNumberValue('min(node())', NaN, {
			contextNode,
		});
	});
});
