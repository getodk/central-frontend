import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#floor()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should convert', () => {
		testContext.assertNumberValue('floor("3")', 3);
		testContext.assertNumberValue('floor(12.5)', 12);
		testContext.assertNumberValue('floor(-3.75)', -4);
		testContext.assertNumberValue('floor(-1.55)', -2);
		testContext.assertNumberValue('floor(2.44)', 2);
		testContext.assertNumberValue('floor(0.001)', 0);
		testContext.assertNumberValue('floor(1.5)', 1);
		testContext.assertNumberValue('floor(5)', 5);
		testContext.assertNumberValue('floor(1.00)', 1);
		testContext.assertNumberValue('floor(-1.005)', -2);
		testContext.assertNumberValue('floor(0.0000001)', 0);
	});

	it.fails('floor() fails when too many arguments are provided', () => {
		testContext.evaluate('floor(1, 2)');
	});

	it.fails('floor fails when too few arguments are provided', () => {
		testContext.evaluate('floor()');
	});
});
