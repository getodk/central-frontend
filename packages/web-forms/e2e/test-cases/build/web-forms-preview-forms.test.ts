import { expect, test } from '@playwright/test';
import { PreviewPage } from '../../page-objects/pages/PreviewPage.js';

test.describe('Web Forms Preview Demo Forms', () => {
	test('demo forms load', async ({ context, page }) => {
		const previewPage = new PreviewPage(page);
		await previewPage.goToBuildPage();

		const formPreviewLinks = await page.locator('.form-preview-link').all();

		expect(formPreviewLinks.length).toBeGreaterThan(0);

		for (const link of formPreviewLinks) {
			const [formPreviewPage] = await Promise.all([context.waitForEvent('page'), link.click()]);

			await formPreviewPage.waitForSelector(
				'.form-initialization-status.error, .form-initialization-status.ready',
				{
					state: 'attached',
				}
			);

			const [failureDialog] = await formPreviewPage.locator('.form-load-failure-dialog').all();

			expect(failureDialog).toBeUndefined();

			await formPreviewPage.close();
		}
	});
});
