import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#today()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	// TODO: mock date, randomize. This test is otherwise testing an implementation
	// of the behavior under test!
	it("should return today's date", () => {
		// given
		const date = new Date();
		const today =
			date.getFullYear() +
			'-' +
			`${date.getMonth() + 1}`.padStart(2, '0') +
			'-' +
			`${date.getDate()}`.padStart(2, '0');

		// expect
		testContext.assertStringValue('today()', today);
	});
});
