import { beforeEach, describe, expect, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, namespaceResolver } from '../helpers.ts';

describe('math functions', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('sin()', () => {
		testContext.assertNumberValue('sin(2)', 0.9092974268256817);
		testContext.assertNumberValue('sin("a")', NaN);
	});

	it('sin() for node', () => {
		testContext = createXFormsTestContext(
			`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
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

		testContext.assertNumberValue(
			'sin(//xhtml:div[@id="testFunctionNodeset2"]/xhtml:p[2])',
			0.9092974268256817
		);
	});

	it('cos()', () => {
		testContext.assertNumberValue('cos(2)', -0.4161468365471424);
		testContext.assertNumberValue('cos("NaN")', NaN);
	});

	it('tan()', () => {
		testContext.assertNumberValue('tan(2)', -2.185039863261519);
		testContext.assertNumberValue('tan("a")', NaN);
		testContext.assertNumberValue('tan("NaN")', NaN);
	});

	it('acos()', () => {
		testContext.assertNumberRounded('acos(0.5)', 1.047197551196598, 10 ** 15);
		testContext.assertNumberRounded('acos(-1)', 3.141592653589793, 10 ** 15);
		testContext.assertNumberValue('acos(2)', NaN);
		testContext.assertNumberValue('acos("a")', NaN);
		testContext.assertNumberValue('acos("NaN")', NaN);
	});

	it('asin()', () => {
		testContext.assertNumberRounded('asin(0.5)', 0.523598775598299, 10 ** 15);
		testContext.assertNumberRounded('asin(-1)', -1.570796326794896, 10 ** 15);
		testContext.assertNumberValue('asin(2)', NaN);
		testContext.assertNumberValue('asin("a")', NaN);
		testContext.assertNumberValue('asin("NaN")', NaN);
	});

	it('atan()', () => {
		testContext.assertNumberRounded('atan(0.5)', 0.463647609000806, 10 ** 15);
		testContext.assertNumberRounded('atan(-1)', -0.785398163397448, 10 ** 15);
		testContext.assertNumberValue('atan("a")', NaN);
		testContext.assertNumberValue('atan("NaN")', NaN);
	});

	it('atan2()', () => {
		testContext.assertNumberValue('atan2(2,3)', 0.5880026035475675);
		testContext.assertNumberValue('atan2(2, "NaN")', NaN);
		testContext.assertNumberValue('atan2(2, "a")', NaN);
		testContext.assertNumberValue('atan2("NaN", 2)', NaN);
	});

	it('log()', () => {
		testContext.assertNumberValue('log(2)', 0.6931471805599453);
		testContext.assertNumberValue('log("NaN")', NaN);
		testContext.assertNumberValue('log("a")', NaN);
	});

	it('log10()', () => {
		testContext.assertNumberValue('log10(2)', 0.3010299956639812);
		testContext.assertNumberValue('log10("NaN")', NaN);
		testContext.assertNumberValue('log10("a")', NaN);
	});

	it('pi()', () => {
		testContext.assertNumberValue('pi()', 3.141592653589793);
	});

	it('exp()', () => {
		testContext.assertNumberValue('exp(2)', 7.38905609893065);
		testContext.assertNumberValue('exp("NaN")', NaN);
	});

	it('exp10()', () => {
		testContext.assertNumberValue('exp10(2)', 100);
		testContext.assertNumberValue('exp10(-2)', 0.01);
		testContext.assertNumberValue('exp10("NaN")', NaN);
	});

	it('sqrt()', () => {
		testContext.assertNumberValue('sqrt(4)', 2);
		testContext.assertNumberValue('sqrt(-2)', NaN);
		testContext.assertNumberValue('sqrt("NaN")', NaN);
	});

	describe('referencing nodesets', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`
        <numbers>
          <minusone>-1</minusone>
          <minuspointfive>-0.5</minuspointfive>
          <zero>0</zero>
          <pointfive>0.5</pointfive>
          <one>1</one>
          <nan>nonsense</nan>
        </numbers>
      `);
		});

		[
			{ expression: 'sin(/numbers/minusone)', expected: -0.8414709848078965 },
			{ expression: 'sin(/numbers/minuspointfive)', expected: -0.479425538604203 },
			{ expression: 'sin(/numbers/zero)', expected: 0 },
			{ expression: 'sin(/numbers/pointfive)', expected: 0.479425538604203 },
			{ expression: 'sin(/numbers/one)', expected: 0.8414709848078965 },
			{ expression: 'sin(/numbers/nan)', expected: NaN },
			{ expression: 'sin(/numbers/missing)', expected: NaN },

			{ expression: 'cos(/numbers/minusone)', expected: 0.5403023058681398 },
			{ expression: 'cos(/numbers/minuspointfive)', expected: 0.8775825618903728 },
			{ expression: 'cos(/numbers/zero)', expected: 1 },
			{ expression: 'cos(/numbers/pointfive)', expected: 0.8775825618903728 },
			{ expression: 'cos(/numbers/one)', expected: 0.5403023058681398 },
			{ expression: 'cos(/numbers/nan)', expected: NaN },
			{ expression: 'cos(/numbers/missing)', expected: NaN },

			// [ 'tan(/numbers/minusone)', -1.5574077246549023 ],
			{ expression: 'tan(/numbers/minuspointfive)', expected: -0.5463024898437905 },
			{ expression: 'tan(/numbers/zero)', expected: 0 },
			{ expression: 'tan(/numbers/pointfive)', expected: 0.5463024898437905 },
			// [ 'tan(/numbers/one)', 1.5574077246549023 ],
			{ expression: 'tan(/numbers/nan)', expected: NaN },
			{ expression: 'tan(/numbers/missing)', expected: NaN },

			{ expression: 'asin(/numbers/minusone)', expected: -1.5707963267948966 },
			{ expression: 'asin(/numbers/minuspointfive)', expected: -0.5235987755982989 },
			{ expression: 'asin(/numbers/zero)', expected: 0 },
			{ expression: 'asin(/numbers/pointfive)', expected: 0.5235987755982989 },
			{ expression: 'asin(/numbers/one)', expected: 1.5707963267948966 },
			{ expression: 'asin(/numbers/nan)', expected: NaN },
			{ expression: 'asin(/numbers/missing)', expected: NaN },

			{ expression: 'acos(/numbers/minusone)', expected: 3.141592653589793 },
			{ expression: 'acos(/numbers/minuspointfive)', expected: 2.0943951023931957 },
			{ expression: 'acos(/numbers/zero)', expected: 1.5707963267948966 },
			{ expression: 'acos(/numbers/pointfive)', expected: 1.0471975511965979 },
			{ expression: 'acos(/numbers/one)', expected: 0 },
			{ expression: 'acos(/numbers/nan)', expected: NaN },
			{ expression: 'acos(/numbers/missing)', expected: NaN },

			{ expression: 'atan(/numbers/minusone)', expected: -0.7853981633974483 },
			{ expression: 'atan(/numbers/minuspointfive)', expected: -0.4636476090008061 },
			{ expression: 'atan(/numbers/zero)', expected: 0 },
			{ expression: 'atan(/numbers/pointfive)', expected: 0.4636476090008061 },
			{ expression: 'atan(/numbers/one)', expected: 0.7853981633974483 },
			{ expression: 'atan(/numbers/nan)', expected: NaN },
			{ expression: 'atan(/numbers/missing)', expected: NaN },

			{ expression: 'log(/numbers/minusone)', expected: NaN },
			{ expression: 'log(/numbers/minuspointfive)', expected: NaN },
			{ expression: 'log(/numbers/zero)', expected: -Infinity },
			{ expression: 'log(/numbers/pointfive)', expected: -0.6931471805599453 },
			{ expression: 'log(/numbers/one)', expected: 0 },
			{ expression: 'log(/numbers/nan)', expected: NaN },
			{ expression: 'log(/numbers/missing)', expected: NaN },

			{ expression: 'log10(/numbers/minusone)', expected: NaN },
			{ expression: 'log10(/numbers/minuspointfive)', expected: NaN },
			{ expression: 'log10(/numbers/zero)', expected: -Infinity },
			{ expression: 'log10(/numbers/pointfive)', expected: -0.3010299956639812 },
			{ expression: 'log10(/numbers/one)', expected: 0 },
			{ expression: 'log10(/numbers/nan)', expected: NaN },
			{ expression: 'log10(/numbers/missing)', expected: NaN },

			{ expression: 'exp(/numbers/minusone)', expected: 0.36787944117144233 },
			{ expression: 'exp(/numbers/minuspointfive)', expected: 0.6065306597126334 },
			{ expression: 'exp(/numbers/zero)', expected: 1 },
			{ expression: 'exp(/numbers/pointfive)', expected: 1.6487212707001282 },
			{ expression: 'exp(/numbers/one)', expected: 2.718281828459045 },
			{ expression: 'exp(/numbers/nan)', expected: NaN },
			{ expression: 'exp(/numbers/missing)', expected: NaN },

			{ expression: 'exp10(/numbers/minusone)', expected: 0.1 },
			{ expression: 'exp10(/numbers/minuspointfive)', expected: 0.31622776601683794 },
			{ expression: 'exp10(/numbers/zero)', expected: 1 },
			{ expression: 'exp10(/numbers/pointfive)', expected: 3.1622776601683795 },
			{ expression: 'exp10(/numbers/one)', expected: 10 },
			{ expression: 'exp10(/numbers/nan)', expected: NaN },
			{ expression: 'exp10(/numbers/missing)', expected: NaN },

			{ expression: 'sqrt(/numbers/minusone)', expected: NaN },
			{ expression: 'sqrt(/numbers/minuspointfive)', expected: NaN },
			{ expression: 'sqrt(/numbers/zero)', expected: 0 },
			{ expression: 'sqrt(/numbers/pointfive)', expected: 0.7071067811865476 },
			{ expression: 'sqrt(/numbers/one)', expected: 1 },
			{ expression: 'sqrt(/numbers/nan)', expected: NaN },
			{ expression: 'sqrt(/numbers/missing)', expected: NaN },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' as '${expected}'`, () => {
				try {
					testContext.assertNumberValue(expression, expected);
				} catch (assertionError) {
					// Slight difference in accuracy in WebKit?
					const decimalDigits = String(expected).split('.')[1];

					if (decimalDigits == null) {
						throw assertionError;
					}

					const { numberValue: actual } = testContext.evaluate(
						expression,
						null,
						XPathResult.NUMBER_TYPE
					);

					expect(actual).toBeCloseTo(expected, decimalDigits.length - 1);
				}
			});
		});
	});
});
