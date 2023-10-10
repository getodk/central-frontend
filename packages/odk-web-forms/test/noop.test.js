// @ts-check

import { describe, it } from 'mocha';

describe('Noop (Mocha)', () => {
	it('passes', () => {
		// @ts-expect-error
		if (true === false) {
			throw new Error('Failed');
		}
	});
});
