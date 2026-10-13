import { test } from '@playwright/test';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.ts';
import { expectFullPageScreenshot } from '../../screenshot.ts';

test.describe('Markdown formatting', () => {
  let formPage: FillFormPage;

  test.beforeEach(async ({ page }) => {
    formPage = await FillFormPage.loadForm(page, '3-notes-with-markdown.xml');
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

    await expectFullPageScreenshot(page, 'full-page.png');
  });
});
