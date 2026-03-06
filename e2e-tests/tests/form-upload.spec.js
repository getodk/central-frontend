import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import BackendClient from '../backend-client';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const projectId = process.env.PROJECT_ID;

let publishedForm;

test.beforeAll(async ({ playwright }, testInfo) => {
  const backendClient = new BackendClient(playwright, `${testInfo.project.name}_form_upload`);
  await backendClient.alwaysHideModal();
  publishedForm = await backendClient.createForm();
  await backendClient.dispose();
});

const login = async (page) => {
  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();

  await page.getByPlaceholder('email address').fill(user);
  await page.getByPlaceholder('password').fill(password);

  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL(appUrl);
};

test.describe('Form Upload', () => {
  test('clears file input when server returns an error', async ({ page }) => {
    await login(page);

    // Navigate to create form page
    await page.goto(`${appUrl}/#/projects/${projectId}`);
    await page.getByRole('button', { name: 'New' }).click();

    // Verify modal is open
    await expect(page.locator('#form-new')).toBeVisible();

    const formXml = path.join(__dirname, '../data/form-without-meta.xml');

    await page.locator('#form-new input[type="file"]').setInputFiles(formXml);

    // Verify filename is displayed
    await expect(page.locator('#form-new-filename')).toContainText('form-without-meta');

    // Click upload
    await page.getByRole('button', { name: 'Upload' }).click();

    // Wait for error alert to appear
    await expect(page.locator('#form-new .red-alert')).toContainText("The form does not contain a 'meta' group");

    // Verify file input is cleared (filename should not be visible)
    await expect(page.locator('#form-new-filename')).not.toBeVisible();
  });

  test('shows error when file is modified before clicking upload anyway', async ({ page, playwright }, testInfo) => {
    // Delete the form to put it in trash
    const backendClient = new BackendClient(playwright, `${testInfo.project.name}_form_upload`);
    await backendClient.deleteForm(publishedForm.xmlFormId);
    await backendClient.dispose();

    // Create a temp file with the same formId as the deleted form
    const formTemplate = fs.readFileSync(
      path.join(__dirname, '../data/form.template.xml'),
      'utf8'
    );
    const formXml = formTemplate.replaceAll('{{ formId }}', publishedForm.xmlFormId);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'form-upload-test-'));
    const tempFilePath = path.join(tempDir, `${publishedForm.xmlFormId}.xml`);
    fs.writeFileSync(tempFilePath, formXml);

    try {
      await login(page);

      // Navigate to create form page
      await page.goto(`${appUrl}/#/projects/${projectId}`);
      await page.getByRole('button', { name: 'New' }).click();

      // Verify modal is open
      await expect(page.locator('#form-new')).toBeVisible();

      // Upload the temp file
      await page.locator('#form-new input[type="file"]').setInputFiles(tempFilePath);

      // Verify filename is displayed
      await expect(page.locator('#form-new-filename')).toContainText(publishedForm.xmlFormId);

      // Click upload
      await page.getByRole('button', { name: 'Upload' }).click();

      // Expect a warning that form with the same ID exists in the trash
      await expect(page.locator('.modal-warnings')).toBeVisible();
      await expect(page.locator('.modal-warnings')).toContainText('Trash');

      // Modify the temp file
      fs.writeFileSync(tempFilePath, formXml.replaceAll(publishedForm.xmlFormId, `${publishedForm.xmlFormId}_new`));

      // Click "Upload anyway"
      await page.getByRole('button', { name: 'Upload anyway' }).click();

      // Expect error that file has been modified
      await expect(page.locator('#form-new .red-alert')).toContainText('could not be read');

      // Verify file input and warnings are cleared
      await expect(page.locator('#form-new-filename')).not.toBeVisible();
      await expect(page.locator('.modal-warnings')).not.toBeVisible();
    } finally {
      // Clean up temp directory
      // fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
