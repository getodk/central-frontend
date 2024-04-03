import { test } from '@playwright/test';

test('visits the app root url', async ({ page }) => {
	await page.goto('/');
});
