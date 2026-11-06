import { expect, test } from '@playwright/test';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.js';

test.describe('Translation', () => {
  let formPage: FillFormPage;

  test.beforeEach(async ({ page }) => {
    formPage = await FillFormPage.loadForm(page, '01-itext-basic.xml');
  });

  test.use({ locale: 'es' });

  test('displays simple translation form in Español', async () => {
    // itext translations work
    const label = formPage.page.getByText('1. Pregunta uno');
    await label.scrollIntoViewIfNeeded();
    await expect(label).toBeVisible();

    // app translations work too
    const sendButton = formPage.page.getByText('Enviar', { exact: true });
    await sendButton.scrollIntoViewIfNeeded();
    await expect(sendButton).toBeVisible();
  });
});
