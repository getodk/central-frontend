import { beforeEach, describe, expect, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('#now()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	// ODK spec says:
	// > Deviates from XForms 1.0 in that it returns the current date and time
	// > including timezone offset (i.e. not normalized to UTC) as described
	// > under the dateTime datatype.
	it('should return a timestamp for this instant', () => {
		// this check might fail if run at precisely midnight ;-)

		// given
		const now = new Date();
		const today = `${now.getFullYear()}-${(1 + now.getMonth()).toString().padStart(2, '0')}-${now
			.getDate()
			.toString()
			.padStart(2, '0')}`;

		// when
		const result = testContext.evaluate('now()', null, XPathResult.STRING_TYPE).stringValue;

		expect(result.split('T')[0]).toEqual(today);

		// assert timezone is included
		expect(result).toMatch(/-07:00$/);
	});
});
