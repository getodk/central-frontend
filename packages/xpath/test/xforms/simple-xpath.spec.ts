import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('openrosa-xpath', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should process simple xpaths', () => {
		testContext = createXFormsTextContentTestContext('val');

		testContext.assertStringValue('/simple/xpath/to/node', 'val');
	});
});
