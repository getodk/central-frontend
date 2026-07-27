import { expect } from '@playwright/test';
import BackendClient from '../backend-client';
import { login, test } from '../util';

const appUrl = process.env.ODK_URL;
const projectId = process.env.PROJECT_ID;

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

test.describe('Default Parameters', () => {

  test('binds value into form using full path', async ({ page }) => {
    await login(page);
    await page.goto(`${appUrl}/projects/${projectId}/forms/${simpleForm.xmlFormId}/submissions/new?d[/data/first_name]=will i am`);
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();
    const xml = await backendClient.getLastSubmission(simpleForm.xmlFormId);
    expect(xml).toContain('<first_name>will i am</first_name>');
  });

  test('binds value into form using relative path', async ({ page }) => {
    await login(page);
    await page.goto(`${appUrl}/projects/${projectId}/forms/${simpleForm.xmlFormId}/submissions/new?d[first_name]=mary`);
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();
    const xml = await backendClient.getLastSubmission(simpleForm.xmlFormId);
    expect(xml).toContain('<first_name>mary</first_name>');
  });

  test('unescapes url parameters correctly', async ({ page }) => {
    await login(page);
    await page.goto(`${appUrl}/projects/${projectId}/forms/${simpleForm.xmlFormId}/submissions/new?d[first_name]=mary? []=`);
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();
    const xml = await backendClient.getLastSubmission(simpleForm.xmlFormId);
    expect(xml).toContain('<first_name>mary? []=</first_name>');
  });

});
