import { expect, test } from '@playwright/test';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.ts';

test.describe('Markdown formatting', () => {
  let formPage: FillFormPage;

  test.beforeEach(async ({ page }) => {
    formPage = await FillFormPage.loadForm(page, '3-notes-with-markdown.xml');
  });

  test('sanitizes user input', async ({ page }) => {
    const input = await formPage.input.getInputByLabel("What's your name?");
    await input.fill('<input name="sanitizeme" />');
    const output = page.locator('input[name="sanitizeme"]');
    expect(await output.count()).toEqual(0);
  });
});
