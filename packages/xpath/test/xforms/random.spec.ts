import { beforeEach, describe, expect, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#random()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	// TODO: this test should seed `random()`, otherwise it's potentially flaky.
	it('should return a number', () => {
		const numberValues = Array(10)
			.fill(null)
			.map(() => {
				// when
				const { numberValue } = testContext.evaluate('random()');

				return numberValue;
			})
			.filter((numberValue: unknown): asserts numberValue is number => {
				// then
				expect(typeof numberValue).toEqual('number');
			});
		const uniqueNumberValues = Array.from(new Set(numberValues));

		// check the numbers are a bit random
		expect(numberValues).toEqual(uniqueNumberValues);
	});

	it('random()', () => {
		testContext.assertStringMatches('random()', /0\.[0-9]{12,}/);
	});
});
