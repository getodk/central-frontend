import { beforeEach, describe, expect, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#random()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
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
				expect(numberValue).to.be.a('number');
			});
		const uniqueNumberValues = Array.from(new Set(numberValues));

		// check the numbers are a bit random
		expect(numberValues).to.deep.equal(uniqueNumberValues);
	});

	it('random()', () => {
		testContext.assertStringMatches('random()', /0\.[0-9]{12,}/);
	});
});
