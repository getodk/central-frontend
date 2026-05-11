import { expect, test } from '@playwright/test';

const { describe } = test;
const it = test;

describe('Noop (E2E)', () => {
	it('passes', () => {
		expect(true).toEqual(true);
	});
});
