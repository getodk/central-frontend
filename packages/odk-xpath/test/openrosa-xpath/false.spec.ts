import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#false()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should evaluate to false', () => {
		testContext.assertBooleanValue('false()', false);
	});

	it.fails('false() fails when too many arguments are provided', () => {
		testContext.evaluate('false("a")');
	});
});
