import { test, expect } from '@playwright/test';
import BackendClient from '../backend-client';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const projectId = process.env.PROJECT_ID;

let backendClient;
let publishedForm;
let draftForm;
let firstSubmission;
let publicLink;

test.beforeAll(async ({ playwright }, testInfo) => {
  backendClient = new BackendClient(playwright, `${testInfo.project.name}_enketo`);
  const resources = await backendClient.createFormAndChildren();
  publishedForm = resources.form;
  draftForm = resources.formDraft;
  firstSubmission = resources.submission;
  publicLink = resources.publicLink;
});

test.afterAll(async () => {
  await backendClient.dispose();
});

const login = async (page) => {
  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Welcome to ODK Central' })).toBeVisible();

  await page.getByPlaceholder('email address').fill(user);
  await page.getByPlaceholder('password').fill(password);

  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL(appUrl);
};

test.describe('Enketo', () => {
  test.describe('all old URLs should be working', () => {
    const oldUrls = [
      {
        description: 'Single Submission Public Link',
        url: ({ enketoOnceId, st }) => `/-/single/${enketoOnceId}?st=${st}`, requireLogin: false,
        newUrl: ({ enketoOnceId, st }) => `/f/${enketoOnceId}?st=${st}`
      },
    ];

    oldUrls.forEach(t => {
      test(`shows Form using old URL - ${t.description}`, async ({ page }) => {
        const { enketoId, enketoOnceId, xmlFormId } = publishedForm;
        const { enketoId: draftEnketoId } = draftForm;
        const { instanceId } = firstSubmission;
        const { token: st } = publicLink;

        if (t.requireLogin) {
          await login(page);
        }

        await page.goto(appUrl + t.url({ enketoId, enketoOnceId, draftEnketoId, xmlFormId, instanceId, st }));

        await page.waitForURL(appUrl + t.newUrl({ enketoId, enketoOnceId, draftEnketoId, xmlFormId, instanceId, st }));

        const frame = await page.frameLocator('iframe');

        if (t.draft) {
          await expect(frame.getByRole('heading', { name: `${publishedForm.name} - v2` })).toBeVisible();
        } else {
          await expect(frame.getByRole('heading', { name: publishedForm.name })).toBeVisible();
        }
      });
    });
  });
});
