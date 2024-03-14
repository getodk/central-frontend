import { expect, test } from '@playwright/test';

const { describe } = test;
const it = test;

describe('Initial e2e test', () => {
	it.skip('has text "Hello world 1"', async ({ page }) => {
		await page.goto('/');

		const text = page.getByText('Hello world 1');

		await expect(text).toHaveText('Hello world 1');
	});
});
