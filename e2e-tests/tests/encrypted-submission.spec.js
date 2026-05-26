import { test, expect } from '@playwright/test';
import BackendClient from '../backend-client';
import { login, ENCRYPTION_SECRET } from '../util';

const appUrl = process.env.ODK_URL;
const projectId = process.env.PROJECT_ID_ENCRYPTED;

const FIRSTNAME_COLUMN_INDEX = 2;
const STATUS_COLUMN_INDEX = 8;

let publishedForm;
let backendClient;

test.beforeAll(async ({ playwright }, testInfo) => {
  backendClient = new BackendClient(playwright, `${testInfo.project.name}_wf`, projectId);
  await backendClient.alwaysHideModal();
  publishedForm = await backendClient.createForm();
  await backendClient.setWebForms(publishedForm.xmlFormId, true);
});

test.afterAll(async () => {
  await backendClient.dispose();
})

const assertCsvResponse = async (response, column, expected) => {
  expect(response).toBeOK();
  const text = await response.text();
  const rows = text.split('\n');
  rows.shift(); // remove the header row
  const actual = rows.map(r => r.split(',')[column]);
  expect(actual).toEqual(expected);
};

test.describe('ODK Web Forms Encrypted', () => {
  test('requires passphrase to download content', async ({ page }) => {
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
    await assertCsvResponse(unencryptedResponse, STATUS_COLUMN_INDEX, ['not decrypted', 'not decrypted']);

    // attempt to download the csv with wrong passphrase
    const wrongPassphraseResponse = await backendClient.downloadCsv(publishedForm.xmlFormId, 'hax');
    expect(wrongPassphraseResponse).not.toBeOK();

    // attempt to download the csv with correct passphrase
    const rightPassphraseResponse = await backendClient.downloadCsv(publishedForm.xmlFormId, ENCRYPTION_SECRET);
    await assertCsvResponse(rightPassphraseResponse, FIRSTNAME_COLUMN_INDEX, ['Jane Doe', 'John Doe']); // csv is reverse date order
  });

});
