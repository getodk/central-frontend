import { expect } from '@playwright/test';
import BackendClient from '../backend-client';
import { login, test } from '../util';

const appUrl = process.env.ODK_URL;
const projectId = process.env.PROJECT_ID_ENCRYPTED;

let simpleForm;
let backendClient;

test.beforeAll(async ({ playwright }, testInfo) => {
  backendClient = new BackendClient(playwright, `${testInfo.project.name}_wf`, projectId);
  await backendClient.alwaysHideModal();
  simpleForm = await backendClient.createForm();
});

test.afterAll(async () => {
  await backendClient.dispose();
});

test.describe('autosave', () => {

  test('saves content when configured', async ({ page }) => {
    await login(page);

    await page.goto(`${appUrl}/projects/${projectId}/forms/${simpleForm.xmlFormId}/settings`);
    await expect(page.locator(`.h1:has-text("${simpleForm.name}")`)).toBeVisible();
    expect(await page.getByLabel('Autosave responses if browser closes or refreshes. Sensitive data may be retained in saved responses.').isChecked()).toEqual(true);

    await page.goto(`${appUrl}/projects/${projectId}/forms/${simpleForm.xmlFormId}/submissions/new`);
    await expect(page.getByRole('heading', { name: simpleForm.name })).toBeVisible();
    await page.getByLabel('First Name').fill('autosa');
    await page.waitForTimeout(1500); // wait for autosave to execute

    await page.reload();
    await expect(page.getByRole('heading', { name: simpleForm.name })).toBeVisible();
    expect(await page.getByLabel('First Name').inputValue()).toEqual('autosa');
  });

});
