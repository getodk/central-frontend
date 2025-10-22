import { expect, test } from '@playwright/test';
import { FillFormPage } from '../page-objects/pages/FillFormPage.ts';
import { PreviewPage } from '../page-objects/pages/PreviewPage.ts';

test.describe('Markdown formatting', () => {
	let formPage: FillFormPage;

	test.beforeEach(async ({ page }) => {
		formPage = new FillFormPage(page);

		const previewPage = new PreviewPage(page);
		await previewPage.goToDevPage();
		await previewPage.openDevDemoForm('notes', '3-notes-with-markdown.xml', 'Notes');
	});

	test('renders markdown styling', async ({ page }) => {
		await formPage.input.fillAndExpectInputValue(
			"What's your name?",
			'<span style="color:green">marty mcfly</span>',
			'<span style="color:green">marty mcfly</span>'
		);
		await formPage.select.selectDropdownOption(
			'.question-container:has-text("Select options minimal")',
			'yes'
		);
		await formPage.select.selectMultiDropdownOption(
			'.question-container:has-text("Select multiple minimal")',
			'yes',
			'no'
		);

		await expect(page).toHaveScreenshot('full-page.png', {
			fullPage: true,
			maxDiffPixelRatio: 0.02,
		});
	});
});
