import { beforeEach, describe, it } from 'vitest';
import { TestContext, createTestContext } from '../helpers';

describe('infix operators', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	describe('math operators', () => {
		describe('with numbers', () => {
			[
				{ expression: '1 + 1', expected: 2 },
				{ expression: '1 - 1', expected: 0 },
				{ expression: '1 * 1', expected: 1 },
				{ expression: '1 div 1', expected: 1 },
				{ expression: '1 mod 1', expected: 0 },
				{ expression: '2 + 1', expected: 3 },
				{ expression: '2 - 1', expected: 1 },
				{ expression: '2 * 1', expected: 2 },
				{ expression: '2 div 1', expected: 2 },
				{ expression: '2 mod 1', expected: 0 },
				{ expression: '1 + 2', expected: 3 },
				{ expression: '1 - 2', expected: -1 },
				{ expression: '1 * 2', expected: 2 },
				{ expression: '1 div 2', expected: 0.5 },
				{ expression: '1 mod 2', expected: 1 },
			].forEach(({ expression, expected }) => {
				it('should evaluate "' + expression + '" as ' + expected, () => {
					testContext.assertNumberValue(expression, expected);
					// TODO: these previously tested the number value as cast to string,
					// is that meaningful for any of these tests?!
					// testContext.assertStringValue(expression, String(expected));
				});

				const spaceless = expression.replace(/\s/g, '');

				it('should evaluate "' + spaceless + '" as ' + expected, () => {
					// TODO: see above re cast to string
					testContext.assertNumberValue(spaceless, expected);
				});
			});
		});
	});

	describe('boolean operators', () => {
		describe('with numbers', () => {
			[
				{ expression: '1 = 1', expected: true },
				{ expression: '1 != 1', expected: false },
				{ expression: '1 = 2', expected: false },
				{ expression: '1 != 2', expected: true },
				{ expression: '1 < 2', expected: true },
				{ expression: '1 > 2', expected: false },
				{ expression: '2 < 1', expected: false },
				{ expression: '2 > 1', expected: true },
				{ expression: '1 <= 2', expected: true },
				{ expression: '1 >= 2', expected: false },
				{ expression: '2 <= 1', expected: false },
				{ expression: '2 >= 1', expected: true },
				{ expression: '1 <= 1', expected: true },
				{ expression: '1 >= 1', expected: true },

				/* weird spacing */
				{ expression: '1=1', expected: true },
				{ expression: '1= 1', expected: true },
				{ expression: '1 =1', expected: true },
				{ expression: '2=1', expected: false },
				{ expression: '2= 1', expected: false },
				{ expression: '2 =1', expected: false },
				{ expression: '1!=1', expected: false },
				{ expression: '1!= 1', expected: false },
				{ expression: '1 !=1', expected: false },
				{ expression: '2!=1', expected: true },
				{ expression: '2!= 1', expected: true },
				{ expression: '2 !=1', expected: true },
				{ expression: '1<1', expected: false },
				{ expression: '1< 1', expected: false },
				{ expression: '1 <1', expected: false },
				{ expression: '2<1', expected: false },
				{ expression: '2< 1', expected: false },
				{ expression: '2 <1', expected: false },
				{ expression: '1>1', expected: false },
				{ expression: '1> 1', expected: false },
				{ expression: '1 >1', expected: false },
				{ expression: '2>1', expected: true },
				{ expression: '2> 1', expected: true },
				{ expression: '2 >1', expected: true },
				{ expression: '1<=1', expected: true },
				{ expression: '1<= 1', expected: true },
				{ expression: '1 <=1', expected: true },
				{ expression: '2<=1', expected: false },
				{ expression: '2<= 1', expected: false },
				{ expression: '2 <=1', expected: false },
				{ expression: '1>=1', expected: true },
				{ expression: '1>= 1', expected: true },
				{ expression: '1 >=1', expected: true },
				{ expression: '2>=1', expected: true },
				{ expression: '2>= 1', expected: true },
				{ expression: '2 >=1', expected: true },
			].forEach(({ expression, expected }) => {
				it('should evaluate "' + expression + '" as ' + expected.toString().toUpperCase(), () => {
					testContext.assertBooleanValue(expression, expected);
				});
			});
		});

		describe('with strings', () => {
			[
				{ expression: '"1" = "1"', expected: true },
				{ expression: '"1" = "2"', expected: false },
				{ expression: '"1" != "1"', expected: false },
				{ expression: '"1" != "2"', expected: true },
				// > When neither object to be compared is a node-set and the operator
				// > is <=, <, >= or >, then the objects are compared by converting both
				// > objects to numbers and comparing the numbers according to IEEE 754.
				//   - https://www.w3.org/TR/1999/REC-xpath-19991116/#booleans
				{ expression: '"1" < "2"', expected: true },
				{ expression: '"1" > "2"', expected: false },
				{ expression: '"2" < "1"', expected: false },
				{ expression: '"2" > "1"', expected: true },
				{ expression: '"1" <= "2"', expected: true },
				{ expression: '"1" >= "2"', expected: false },
				{ expression: '"2" <= "1"', expected: false },
				{ expression: '"2" >= "1"', expected: true },
				{ expression: '"1" <= "1"', expected: true },
				{ expression: '"1" >= "1"', expected: true },
				{ expression: '"aardvark" < "aligator"', expected: false },
				{ expression: '"aardvark" <= "aligator"', expected: false },
				{ expression: '"aligator" < "aardvark"', expected: false },
				{ expression: '"aligator" <= "aardvark"', expected: false },
				{ expression: '"possum" > "aligator"', expected: false },
				{ expression: '"possum" >= "aligator"', expected: false },
				{ expression: '"aligator" > "possum"', expected: false },
				{ expression: '"aligator" >= "possum"', expected: false },
			].forEach(({ expression, expected }) => {
				it('should evaluate "' + expression + '" as ' + expected.toString().toUpperCase(), () => {
					testContext.assertBooleanValue(expression, expected);
				});
			});
		});

		describe('with booleans', () => {
			[
				{ expression: 'true() and true()', expected: true },
				{ expression: 'false() and true()', expected: false },
				{ expression: 'true() and false()', expected: false },
				{ expression: 'false() and false()', expected: false },
				{ expression: 'true() or true()', expected: true },
				{ expression: 'false() or true()', expected: true },
				{ expression: 'true() or false()', expected: true },
				{ expression: 'false() or false()', expected: false },
			].forEach(({ expression, expected }) => {
				it('should evaluate "' + expression + '" as ' + expected.toString().toUpperCase(), () => {
					testContext.assertBooleanValue(expression, expected);
				});
			});
		});
	});

	describe('with nodes', () => {
		beforeEach(() => {
			testContext = createTestContext(`
      <data>
        <a>1</a>
        <b>2</b>
      </data>`);
		});

		[
			{ expression: '/data/a!= /data/b', expected: true },
			{ expression: '/data/a!=/data/b', expected: true },
			{ expression: '/data/a!= "1"', expected: false },
			{ expression: '/data/a!="1"', expected: false },
			{ expression: '"1" != /data/a', expected: false },
			{ expression: '"1"!= /data/a', expected: false },
			{ expression: '"1"!=/data/a', expected: false },

			{ expression: '/data/a<= /data/b', expected: true },
			{ expression: '/data/a<=/data/b', expected: true },
			{ expression: '/data/a<= "1"', expected: true },
			{ expression: '/data/a<="1"', expected: true },
			{ expression: '"1" <= /data/a', expected: true },
			{ expression: '"1"<= /data/a', expected: true },
			{ expression: '"1"<=/data/a', expected: true },

			{ expression: '/data/a>= /data/b', expected: false },
			{ expression: '/data/a>=/data/b', expected: false },
			{ expression: '/data/a>= "1"', expected: true },
			{ expression: '/data/a>="1"', expected: true },
			{ expression: '"1" >= /data/a', expected: true },
			{ expression: '"1">= /data/a', expected: true },
			{ expression: '"1">=/data/a', expected: true },
		].forEach(({ expression, expected }) => {
			it('should evaluate "' + expression + '" as ' + expected.toString().toUpperCase(), () => {
				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('number operations', () => {
		it('*,+,-,mod,div precedence rules are applied correctly', () => {
			[
				{ expression: '1+2*3', expected: 7 },
				{ expression: '2*3+1', expected: 7 },
				{ expression: '1-10 mod 3 div 3', expected: 0.6666666666666667 },
				{ expression: '4-3*4+5-1', expected: -4 },
				{ expression: '(4-3)*4+5-1', expected: 8 },
				{ expression: '8 div 2 + 4', expected: 8 },
			].forEach(({ expression, expected }) => {
				testContext.assertNumberValue(expression, expected);
			});

			testContext.assertNumberValue('1-1', 0);
			testContext.assertNumberValue('1 - 1', 0);
		});

		describe('node-based calculatations with strings', () => {
			beforeEach(() => {
				testContext = createTestContext(`<data><number id="num">4</number></data>`);
			});

			it('should support simple addition', () => {
				// It doesn't matter whether a string or number is requested, an infix operator should ensure that both
				// left and right operands are converted to numbers during evaluation.
				// If multiple nodes are returned, the value of the first node will be used.
				testContext.assertStringValue('/data/number + 1', '5');
			});

			it('should support addition without spaces around the operator', () => {
				// expect
				testContext.assertStringValue('/data/number+1', '5');
			});

			it('should support relative nodesets with strings', () => {
				const contextNode = testContext.document.getElementById('num');
				// expect
				testContext.assertStringValue('../number + 1', '5', {
					contextNode,
				});
			});

			it('should support relative nodesets with strings without spaces around the operator', () => {
				const contextNode = testContext.document.getElementById('num');
				// expect
				testContext.assertStringValue('../number+1', '5', {
					contextNode,
				});
			});
		});

		it('calculation with multiple nodes operand returned as string', () => {
			testContext = createTestContext(`<data>
        <number>4</number>
        <number>10</number>
      </data>`);

			// It doesn't matter whether a string or number is requested, an infix operator should ensure that both
			// left and right operands are converted to numbers during evaluation.
			// If multiple nodes are returned, the value of the first node will be used.
			testContext.assertStringValue('/data/number + 1', '5');
		});
	});
});
