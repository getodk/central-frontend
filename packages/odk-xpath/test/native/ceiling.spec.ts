import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('ceiling', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('ceiling()', () => {
		testContext.assertNumberValue('ceiling(-1.55)', -1);
		testContext.assertNumberValue('ceiling(2.44)', 3);
		testContext.assertNumberValue('ceiling(0.001)', 1);
		testContext.assertNumberValue('ceiling(1.5)', 2);
		testContext.assertNumberValue('ceiling(5)', 5);
		testContext.assertNumberValue('ceiling(1.00)', 1);
		testContext.assertNumberValue('ceiling(-1.05)', -1);
		testContext.assertNumberValue('ceiling(0.0000001)', 1);
	});

	it.fails('ceiling() fails when too many arguments are provided', () => {
		testContext.evaluate('ceiling(1, 2)');
	});

	it.fails('ceiling() fails when not enough arguments are provided', () => {
		testContext.evaluate('ceiling()');
	});
});
