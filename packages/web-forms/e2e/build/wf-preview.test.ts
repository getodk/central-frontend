import { expect, test } from '@playwright/test';

test('Web Forms Preview: demo forms load', async ({ context, page }) => {
	await page.goto('http://localhost:5174/');

	const formPreviewLinks = await page.locator('.form-preview-link').all();

	expect(formPreviewLinks.length).toBeGreaterThan(0);

	for await (const link of formPreviewLinks) {
		const [previewPage] = await Promise.all([context.waitForEvent('page'), link.click()]);

		await previewPage.waitForSelector(
			'.form-initialization-status.error, .form-initialization-status.ready',
			{
				state: 'attached',
			}
		);

		const [failureDialog] = await previewPage.locator('.form-load-failure-dialog').all();

		expect(failureDialog).toBeUndefined();

		await previewPage.close();
	}
});
