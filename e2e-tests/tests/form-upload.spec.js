import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import BackendClient from '../backend-client';
import { login } from '../util';

const appUrl = process.env.ODK_URL;
const projectId = process.env.PROJECT_ID;

let publishedForm;

test.beforeAll(async ({ playwright }, testInfo) => {
  const backendClient = new BackendClient(playwright, `${testInfo.project.name}_form_upload`);
  await backendClient.alwaysHideModal();
  publishedForm = await backendClient.createForm();
  await backendClient.dispose();
});

test.describe('Form Upload', () => {
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
      await page.goto(`${appUrl}/projects/${projectId}/new-form`);

      // Upload the temp file
      await page.locator('#form-upload input[type="file"]').setInputFiles(tempFilePath);

      // Verify filename is displayed
      await expect(page.locator('#form-upload-filename')).toContainText(publishedForm.xmlFormId);

      // Click upload
      await page.getByRole('button', { name: 'Upload' }).click();

      // Expect a warning that form with the same ID exists in the trash
      await expect(page.locator('.form-upload-warnings')).toBeVisible();
      await expect(page.locator('.form-upload-warnings')).toContainText('Trash');

      // Modify the temp file
      fs.writeFileSync(tempFilePath, formXml.replaceAll(publishedForm.xmlFormId, `${publishedForm.xmlFormId}_new`));

      // Click "Upload anyway"
      await page.getByRole('button', { name: 'Upload anyway' }).click();

      // Expect error that file has been modified
      await expect(page.locator('#alerts .red-alert')).toContainText('could not be read');

      // Verify file input and warnings are cleared
      await expect(page.locator('#form-upload-filename')).not.toBeVisible();
      await expect(page.locator('.form-upload-warnings')).not.toBeVisible();
    } finally {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
