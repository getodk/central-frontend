import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#uuid()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should provide an RFC 4122 version 4 compliant UUID string', () => {
		testContext.assertStringMatches(
			'uuid()',
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		);
	});

	it('uuid()', () => {
		testContext.assertStringLength('uuid()', 36);
	});

	it('should provide variable length token', () => {
		[
			{ expression: 'uuid()', expected: 36 },
			{ expression: 'uuid(6)', expected: 6 },
			{ expression: 'uuid(16)', expected: 16 },
			{ expression: 'uuid(20)', expected: 20 },
			{ expression: 'uuid(0)', expected: 0 },
		].forEach(({ expression, expected }) => {
			testContext.assertStringLength(expression, expected);
		});
	});

	describe('referencing nodesets', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(`
        <numbers>
          <one>1</one>
          <two>2</two>
          <six>6</six>
          <ninetynine>99</ninetynine>
        </numbers>
      `);
		});

		[
			{ expression: 'uuid(/numbers/one)', expected: 1 },
			{ expression: 'uuid(/numbers/two)', expected: 2 },
			{ expression: 'uuid(/numbers/six)', expected: 6 },
			{ expression: 'uuid(/numbers/ninetynine)', expected: 99 },
		].forEach(({ expression, expected }) => {
			it(`should evaluate '${expression}' to a ${expected} string`, () => {
				testContext.assertStringLength(expression, expected);
			});
		});

		[{ expression: 'uuid(/nonsense)' }, { expression: 'uuid(/numbers)' }].forEach(
			({ expression }) => {
				it.fails(
					`should throw an error when evaluating '${expression}' because the nodeset evaluates to NaN`,
					() => {
						testContext.evaluate(expression);
					}
				);
			}
		);
	});
});
