import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#format-date-time()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	[{ expression: 'format-date-time("2001-12-31", "%b %e, %Y")', expected: 'Dec 31, 2001' }].forEach(
		({ expression, expected }) => {
			it(expression + ' should evaluate to ' + expected, () => {
				testContext.assertStringValue(expression, expected);
			});
		}
	);
});
