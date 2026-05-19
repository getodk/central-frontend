import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#true()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should evaluate to true', () => {
		testContext.assertBooleanValue('true()', true);
	});

	it.fails('true() fails when too many arguments are provided', () => {
		testContext.evaluate('true(1)');
	});
});
