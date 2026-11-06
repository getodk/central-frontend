import { test } from '@playwright/test';
import { BrowserContext } from 'playwright-core';
import { FillFormPage } from '../../page-objects/pages/FillFormPage.ts';
import { expectScreenshot } from '../../screenshot.ts';

const QUESTION_WIDTH = 836;

test.describe('Range (Visual)', () => {
  let formPage: FillFormPage;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    formPage = await FillFormPage.loadForm(page, 'range-tick-labels.xml');
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('renders horizontal labels that wrap', async () => {
    await formPage.range.selectValue('Horizontal wrapping', 50);
    await expectScreenshot({
      page: formPage.page,
      locator: formPage.range.getRangeContainer('Horizontal wrapping'),
      screenshotName: 'range-horizontal-labels.png',
      width: QUESTION_WIDTH,
      height: 170,
    });
  });

  test('renders vertical labels that wrap', async () => {
    await formPage.range.selectValue('Vertical wrapping', 0);
    await expectScreenshot({
      page: formPage.page,
      locator: formPage.range.getRangeContainer('Vertical wrapping'),
      screenshotName: 'range-vertical-labels.png',
      width: QUESTION_WIDTH,
      height: 408,
    });
  });

  test('renders the placeholder with no value selected', async () => {
    await expectScreenshot({
      page: formPage.page,
      locator: formPage.range.getRangeContainer('Placeholder'),
      screenshotName: 'range-placeholder-no-value.png',
      width: QUESTION_WIDTH,
      height: 140,
    });
  });

  test('renders the fill once a value replaces the placeholder', async () => {
    await formPage.range.selectValue('Placeholder', 75);
    await expectScreenshot({
      page: formPage.page,
      locator: formPage.range.getRangeContainer('Placeholder'),
      screenshotName: 'range-placeholder-value-selected.png',
      width: QUESTION_WIDTH,
      height: 140,
    });
  });
});
