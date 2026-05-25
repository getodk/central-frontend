import { test, expect } from '@playwright/test';
import BackendClient from '../backend-client';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const projectId = process.env.PROJECT_ID_ENCRYPTED;

const FIRSTNAME_COLUMN_INDEX = 2;
const STATUS_COLUMN_INDEX = 8;

let publishedForm;
let backendClient;

test.beforeAll(async ({ playwright }, testInfo) => {
  backendClient = new BackendClient(playwright, `${testInfo.project.name}_wf`, projectId);
  await backendClient.alwaysHideModal();
  publishedForm = await backendClient.createForm();
  await backendClient.setWebForms(publishedForm.xmlFormId, true); // this shouldn't be necessary - remove before pushing
});

test.afterAll(async () => {
  await backendClient.dispose();
})

const login = async (page) => {
  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Welcome to ODK Central' })).toBeVisible();

  await page.getByPlaceholder('email address').fill(user);
  await page.getByPlaceholder('password').fill(password);

  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL(appUrl);
};

const checkResponse = async (response, column, values) => {
  expect(response).toBeOK();
  const text = await response.text();
  const rows = text.split('\n');
  for (let i = 0; i < values.length; i++) {
    const actual = rows[i + 1].split(',')[column];
    expect(actual).toBe(values[i]);
  }
};

test.describe('ODK Web Forms Encrypted', () => {
  test.only('allows multiple submission', async ({ page }) => {
    await login(page);

    await page.goto(`${appUrl}/projects/${projectId}/forms/${publishedForm.xmlFormId}/submissions/new`);
    await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();

    await page.getByLabel('First Name').fill('John Doe');
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();

    await page.getByRole('button', { name: 'fill out again' }).click();
    await page.getByLabel('First Name').fill('Jane Doe');
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();

    // attempt to download the file with no key
    const unencryptedResponse = await backendClient.downloadCsv(publishedForm.xmlFormId);
    await checkResponse(unencryptedResponse, STATUS_COLUMN_INDEX, ['not decrypted', 'not decrypted']);

    // attempt to download the csv with wrong passphrase
    const wrongPassphraseResponse = await backendClient.downloadCsv(publishedForm.xmlFormId, 'hax');
    expect(wrongPassphraseResponse).not.toBeOK();

    // attempt to download the csv with correct passphrase
    const rightPassphraseResponse = await backendClient.downloadCsv(publishedForm.xmlFormId, 'encryptionsecret');
    await checkResponse(rightPassphraseResponse, FIRSTNAME_COLUMN_INDEX, ['Jane Doe', 'John Doe']); // csv is reverse date order
  });

});
