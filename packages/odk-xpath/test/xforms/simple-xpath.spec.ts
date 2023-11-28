import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('openrosa-xpath', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should process simple xpaths', () => {
		testContext = createXFormsTextContentTestContext('val');

		testContext.assertStringValue('/simple/xpath/to/node', 'val');
	});
});
