import { test, expect } from '@playwright/test';
import BackendClient from '../backend-client';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const projectId = process.env.PROJECT_ID;

let publishedForm;
let draftForm;
let firstSubmission;
let publicLink;

test.beforeAll(async ({ playwright }, testInfo) => {
  const backendClient = new BackendClient(playwright, `${testInfo.project.name}_wf`);
  const resources = await backendClient.createFormAndChildren();
  publishedForm = resources.form;
  draftForm = resources.formDraft;
  firstSubmission = resources.submission;
  publicLink = resources.publicLink;

  await backendClient.setWebForms(resources.form.xmlFormId, true);
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

test.describe('ODK Web Forms', () => {
  test.describe('all old URLs should be working', () => {
    const oldUrls = [
      {
        description: 'New Submission',
        url: ({ enketoId }) => `/-/${enketoId}`, requireLogin: true
      }, {
        description: 'Edit Submission',
        url: ({ enketoId, instanceId }) => `/-/edit/${enketoId}?instance_id=${instanceId}`, requireLogin: true
      }, {
        description: 'Preview Form',
        url: ({ enketoId }) => `/-/preview/${enketoId}`, requireLogin: true
      }, {
        description: 'Preview Web Forms',
        url: ({ xmlFormId }) => `/#/projects/${projectId}/forms/${xmlFormId}/preview`, requireLogin: true
      }, {
        description: 'New Draft Submission',
        url: ({ draftEnketoId }) => `/-/${draftEnketoId}`, requireLogin: true
      }, {
        description: 'Prevew Draft Form',
        url: ({ draftEnketoId }) => `/-/preview/${draftEnketoId}`, requireLogin: true
      }, {
        description: 'Preview Draft Web Form',
        url: ({ xmlFormId }) => `/#/projects/${projectId}/forms/${xmlFormId}/draft/preview`, requireLogin: true
      }, {
        description: 'Public Link',
        url: ({ enketoId, st }) => `/-/single/${enketoId}?st=${st}`, requireLogin: false
      }, {
        description: 'Single Submission Public Link',
        url: ({ enketoOnceId, st }) => `/-/single/${enketoOnceId}?st=${st}`, requireLogin: false
      }, {
        description: 'Offline Submissions',
        url: ({ enketoId }) => `/-/x/${enketoId}`, requireLogin: true
      }, {
        description: 'Offline Submissions Public Link',
        url: ({ enketoId, st }) => `/-/x/${enketoId}?st=${st}`, requireLogin: false
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

        if (t.draft) {
          await expect(page.getByRole('heading', { name: `${publishedForm.name} - v2` })).toBeVisible();
        } else {
          await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();
        }
      });
    });
  });

  test('allows multiple submission', async ({ page }) => {
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
  });

  test('allows user to relogin on session expiry', async ({ page, context }) => {
    await login(page);

    const page2 = await context.newPage();

    await page2.goto(`${appUrl}/projects/${projectId}/forms/${publishedForm.xmlFormId}/submissions/new`);

    await expect(page2.getByRole('heading', { name: publishedForm.name })).toBeVisible();

    await page2.getByLabel('First Name').fill('John Doe');

    await page.locator('#navbar-actions a[data-toggle="dropdown"]').click();

    await page.getByRole('link', { name: 'log out' }).click();

    await page2.getByRole('button', { name: 'send' }).click();

    await expect(page2.getByRole('heading', { name: 'Session expired' })).toBeVisible();

    const [page3] = await Promise.all([
      context.waitForEvent('page'),
      page2.getByRole('link', { name: 'here' }).click()
    ]);

    await login(page3);

    await page2.locator('.modal-actions .btn-primary').click();

    await page2.getByRole('button', { name: 'send' }).click();

    await expect(page2.getByRole('heading', { name: 'successful' })).toBeVisible();
  });
});
