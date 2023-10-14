// @ts-check

import { describe, it } from 'mocha';

describe('Noop (Mocha)', () => {
	it('passes', () => {
		// @ts-expect-error - Obviously this condition cannot pass!
		if (true === false) {
			throw new Error('Failed');
		}
	});
});
