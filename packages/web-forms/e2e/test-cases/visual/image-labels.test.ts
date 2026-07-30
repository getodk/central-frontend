import { test } from '@playwright/test';
import { BrowserContext } from 'playwright-core';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.js';
import { expectScreenshot } from '../../screenshot.js';

test.describe('Image Selects (Visual)', () => {
  let formPage: FillFormPage;
  let context: BrowserContext;

  /**
   * Opens the form once and runs all test cases to optimize suite execution speed.
   */
  test.beforeAll(async ({ browser }) => {
    const permissions = ['geolocation'];
    if (browser.browserType().name() === 'chromium') {
      permissions.push('clipboard-write');
    }

    context = await browser.newContext({
      geolocation: { latitude: -28.996, longitude: 134.762 }, // South Australia,
      permissions: permissions,
    });
    const page = await context.newPage();

    formPage = await FillFormPage.loadForm(page, 'all-question-types-v2024091201-3.xml');
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test.describe('Select with images', () => {
    test.beforeAll(async () => {
      await formPage.waitForNetworkIdle();
      await formPage.text.expectHint(
        'select_one type with columns appearance, 4 text + image choices. Choices are layed out in fixed-width columns based on screen width.'
      );
    });

    test('select one with fixed columns', async () => {
      const select = formPage.page.locator('.question-container', {
        hasText: 'Select one with fixed columns',
      });
      await expectScreenshot({
        page: formPage.page,
        locator: select,
        screenshotName: 'select-one-with-fixed-columns.png',
        width: 834,
        height: 357,
      });
    });

    test('select one with fixed column count', async () => {
      const select = formPage.page.locator('.question-container', {
        hasText: 'Select one with fixed column count',
      });
      await expectScreenshot({
        page: formPage.page,
        locator: select,
        screenshotName: 'select-one-with-fixed-column-count.png',
        width: 834,
        height: 856,
      });
    });

    test('select one with packed columns and no buttons', async () => {
      const select = formPage.page.locator('.question-container', {
        hasText: 'Select one with packed columns and no buttons',
      });
      await expectScreenshot({
        page: formPage.page,
        locator: select,
        screenshotName: 'select-one-with-packed-columns.png',
        width: 834,
        height: 704,
      });
    });

    test('likert', async () => {
      const select = formPage.page.locator('.question-container', { hasText: 'Likert' });
      await expectScreenshot({
        page: formPage.page,
        locator: select,
        screenshotName: 'likert.png',
        width: 834,
        height: 362,
      });
    });
  });
});
