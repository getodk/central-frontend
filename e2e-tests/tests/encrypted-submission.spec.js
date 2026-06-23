import { expect } from '@playwright/test';
import BackendClient from '../backend-client';
import { login, test, ENCRYPTION_SECRET } from '../util';
import Zip from 'adm-zip';

const appUrl = process.env.ODK_URL;
const projectId = process.env.PROJECT_ID_ENCRYPTED;

let simpleForm;
let formWithAttachment;
let backendClient;

test.beforeAll(async ({ playwright }, testInfo) => {
  backendClient = new BackendClient(playwright, `${testInfo.project.name}_wf`, projectId);
  await backendClient.alwaysHideModal();
  simpleForm = await backendClient.createForm();
  formWithAttachment = await backendClient.createAttachmentForm();
});

test.afterAll(async () => {
  await backendClient.dispose();
});

const assertCsv = (text, column, expected) => {
  const rows = text.split('\n');
  rows.shift(); // remove the header row
  const actual = rows.map(r => r.split(',')[column]);
  expect(actual).toEqual(expected);
};

const assertCsvResponse = async (response, column, expected) => {
  expect(response).toBeOK();
  const text = await response.text();
  assertCsv(text, column, expected);
};

const assertZipResponse = async (response, csvColumn, csvExpected, attachmentExpected) => {
  expect(response).toBeOK();

  const body = await response.body();
  const zip = new Zip(body);
  const entries = zip.getEntries();
  let count = 0;
  for (const entry of entries) {
    const name = entry.entryName;
    const text = zip.readAsText(entry);
    if (name.endsWith('.csv')) {
      assertCsv(text, csvColumn, csvExpected);
    } else if (name.endsWith('.txt')) {
      expect(text).toEqual(attachmentExpected[count++]);
    } else {
      throw new Error('unexpected entry: ' + name);
    }
  }
};

test.describe('ODK Web Forms Encrypted', () => {

  test('requires passphrase to download content', async ({ page }) => {

    const firstNameColumnIndex = 2;
    const statusColumnIndex = 8;

    await login(page);

    await page.goto(`${appUrl}/projects/${projectId}/forms/${simpleForm.xmlFormId}/submissions/new`);
    await expect(page.getByRole('heading', { name: simpleForm.name })).toBeVisible();

    await page.getByLabel('First Name').fill('John Doe');
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();

    await page.getByRole('button', { name: 'fill out again' }).click();
    await page.getByLabel('First Name').fill('Jane Doe');
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();

    // attempt to download the file with no key
    const unencryptedResponse = await backendClient.downloadCsv(simpleForm.xmlFormId);
    await assertCsvResponse(unencryptedResponse, statusColumnIndex, ['not decrypted', 'not decrypted']);

    // attempt to download the csv with wrong passphrase
    const wrongPassphraseResponse = await backendClient.downloadCsv(simpleForm.xmlFormId, 'hax');
    expect(wrongPassphraseResponse).not.toBeOK();

    // attempt to download the csv with correct passphrase
    const rightPassphraseResponse = await backendClient.downloadCsv(simpleForm.xmlFormId, ENCRYPTION_SECRET);
    await assertCsvResponse(rightPassphraseResponse, firstNameColumnIndex, ['Jane Doe', 'John Doe']); // csv is reverse date order
  });

  test('supports downloading attachments', async ({ page }) => {

    const firstNameColumnIndex = 2;
    const statusColumnIndex = 9;

    await login(page);

    await page.goto(`${appUrl}/projects/${projectId}/forms/${formWithAttachment.xmlFormId}/submissions/new`);
    await expect(page.getByRole('heading', { name: formWithAttachment.name })).toBeVisible();

    await page.getByLabel('First Name').fill('John Doe');
    await page.locator('input[type=file]').setInputFiles({
      name: 'john.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('info about john')
    });
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();

    await page.getByRole('button', { name: 'fill out again' }).click();
    await page.getByLabel('First Name').fill('Jane Doe');
    await page.locator('input[type=file]').setInputFiles({
      name: 'jane.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('info about jane')
    });
    await page.getByRole('button', { name: 'send' }).click();
    await expect(page.getByRole('heading', { name: 'Successful' })).toBeVisible();

    // attempt to download the file with no key
    const unencryptedResponse = await backendClient.downloadZip(formWithAttachment.xmlFormId);
    await assertZipResponse(unencryptedResponse, statusColumnIndex, ['not decrypted', 'not decrypted'], []);

    // attempt to download the csv with wrong passphrase
    const wrongPassphraseResponse = await backendClient.downloadZip(formWithAttachment.xmlFormId, 'hax');
    expect(wrongPassphraseResponse).not.toBeOK();

    // attempt to download the csv with correct passphrase
    const rightPassphraseResponse = await backendClient.downloadZip(formWithAttachment.xmlFormId, ENCRYPTION_SECRET);
    await assertZipResponse(rightPassphraseResponse, firstNameColumnIndex, ['Jane Doe', 'John Doe'], ['info about john', 'info about jane']); // csv is reverse date order, but attachments aren't
  });

});
