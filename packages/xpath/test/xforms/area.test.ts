import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('distance() and area() functions', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	const SHAPE1 =
		'7.9377 -11.5845 0 0;7.9324 -11.5902 0 0;7.927 -11.5857 0 0;7.925 -11.578 0 0;7.9267 -11.5722 0 0;7.9325 -11.5708 0 0;7.9372 -11.5737 0 0;7.9393 -11.579 0 0;7.9377 -11.5845 0 0';
	const TRACE1 =
		'38.253094215699576 21.756382658677467;38.25021274773806 21.756382658677467;38.25007793942195 21.763892843919166;38.25290886154963 21.763935759263404;38.25146813817506 21.758421137528785';
	const TRACE2 =
		'38.25304740874071 21.75644703234866;38.25308110946615 21.763377860443143;38.25078942453431 21.763399318115262;38.25090738066984 21.756640151397733;38.25197740258244 21.75892539347842';
	const TRACE3 =
		'38.252845204059824 21.763313487426785;38.25303055837213 21.755867675201443;38.25072202094234 21.755803302185086;38.25062091543717 21.76294870700076;38.25183417221606 21.75692982997134';
	const LINE = '7.9377 -11.5845 0 0;7.9324 -11.5902 0 0';
	const SAME = '7.9377 -11.5845 0 0;7.9377 -11.5845 0 0';

	[
		{ argument: SHAPE1, expected: { area: 2333220.77, distance: 5724.36 } },
		{ argument: TRACE1, expected: { area: 151451.76, distance: 1800.69 } },
		{ argument: TRACE2, expected: { area: 122754.94, distance: 1684.62 } },
		{ argument: TRACE3, expected: { area: 93911.49, distance: 2076.24 } },
		{ argument: LINE, expected: { area: 0.0, distance: 861.99 } },
		{ argument: SAME, expected: { area: 0.0, distance: 0.0 } },
		{ argument: '0 0;0 1', expected: { area: 0.0, distance: 111318.85 } },
		{ argument: '0 0;0 90', expected: { area: 0.0, distance: 10018696.05 } },
		{ argument: '90 0;90 1', expected: { area: 0.0, distance: 0.0 } },
		{ argument: '5000 5000; 5000 5000', expected: { area: NaN, distance: NaN } },
		{ argument: 'a', expected: { area: NaN, distance: NaN } },
		{ argument: '', expected: { area: NaN, distance: NaN } },
	].forEach(({ argument, expected }, i) => {
		it(`area(${argument}) works (${i + 1})`, () => {
			testContext.assertNumberValue(`area("${argument}")`, expected.area);
		});

		it(`distance(${argument}) works (${i + 1})`, () => {
			testContext.assertNumberValue(`distance("${argument}")`, expected.distance);
		});
	});

	describe('area with nodes', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`
        <root>
          <div id="FunctionArea1">
            <div>7.9377 -11.5845 0 0</div>
            <div>7.9324 -11.5902 0 0</div>
            <div>7.927 -11.5857 0 0</div>
            <div>7.925 -11.578 0 0</div>
            <div>7.9267 -11.5722 0 0</div>
            <div>7.9325 -11.5708 0 0</div>
            <div>7.9372 -11.5737 0 0</div>
            <div>7.9393 -11.579 0 0</div>
            <div>7.9377 -11.5845 0 0</div>
          </div>
          <div id="FunctionArea2">
            <div>38.25304740874071 21.75644703234866</div>
            <div>38.25308110946615 21.763377860443143</div>
            <div>38.25078942453431 21.763399318115262</div>
            <div>38.25090738066984 21.756640151397733</div>
            <div>38.25197740258244 21.75892539347842</div>
          </div>
          <div id="FunctionArea3">
            <div>38.252845204059824 21.763313487426785</div>
            <div>38.25303055837213 21.755867675201443</div>
            <div>38.25072202094234 21.755803302185086</div>
            <div>38.25062091543717 21.76294870700076</div>
            <div>38.25183417221606 21.75692982997134</div>
          </div>

          <div id="FunctionArea4">7.9377 -11.5845 0 0;7.9324 -11.5902 0 0;7.927 -11.5857 0 0;7.925 -11.578 0 0;7.9267 -11.5722 0 0;7.9325 -11.5708 0 0;7.9372 -11.5737 0 0;7.9393 -11.579 0 0;7.9377 -11.5845 0 0</div>
        </root>`);
		});

		[
			{ id: 'FunctionArea1', argument: './*', expected: { area: 2333220.77, distance: 5724.36 } },
			{ id: 'FunctionArea4', argument: '.', expected: { area: 2333220.77, distance: 5724.36 } },
			{ id: 'FunctionArea2', argument: './*', expected: { area: 122754.94, distance: 1684.62 } },
			{ id: 'FunctionArea3', argument: './*', expected: { area: 93911.49, distance: 2076.24 } },
		].forEach(({ id, argument, expected }, i) => {
			it(`area(${argument}) works (${i + 1})`, () => {
				const contextNode = testContext.document.getElementById(id);

				testContext.assertNumberValue(`area(${argument})`, expected.area, {
					contextNode,
				});
			});

			it(`distance(${argument}) works (${i + 1})`, () => {
				const contextNode = testContext.document.getElementById(id);

				testContext.assertNumberValue(`distance(${argument})`, expected.distance, {
					contextNode,
				});
			});
		});
	});

	[{ expression: 'area()' }, { expression: 'distance()' }].forEach(({ expression }) => {
		it.fails(`throws error when no parameters are provided in expression ${expression}`, () => {
			testContext.evaluate(expression);
		});
	});
});
