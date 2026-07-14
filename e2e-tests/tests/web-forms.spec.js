import { expect } from '@playwright/test';
import BackendClient from '../backend-client';
import { login, test, submitLogin } from '../util';

const appUrl = process.env.ODK_URL;
const projectId = process.env.PROJECT_ID;

let publishedForm;
let draftForm;
let firstSubmission;
let publicLink;

test.beforeAll(async ({ playwright }, testInfo) => {
  const backendClient = new BackendClient(playwright, `${testInfo.project.name}_wf`);
  await backendClient.alwaysHideModal();
  const resources = await backendClient.createFormAndChildren();
  publishedForm = resources.form;
  draftForm = resources.formDraft;
  firstSubmission = resources.submission;
  publicLink = resources.publicLink;

  await backendClient.dispose();
});

test.describe('ODK Web Forms', () => {
  test.describe('all old URLs should be working', () => {
    const oldUrls = [
      {
        description: 'New Submission',
        url: ({ enketoId }) => `/-/${enketoId}`, requireLogin: true
      }, {
        description: 'Preview Form',
        url: ({ enketoId }) => `/-/preview/${enketoId}`, requireLogin: true
      }, {
        description: 'Preview Web Forms',
        url: ({ xmlFormId }) => `/#/projects/${projectId}/forms/${xmlFormId}/preview`, requireLogin: true
      }, {
        description: 'New Draft Submission',
        url: ({ draftEnketoId }) => `/-/${draftEnketoId}`, requireLogin: true, draft: true
      }, {
        description: 'Preview Draft Form',
        url: ({ draftEnketoId }) => `/-/preview/${draftEnketoId}`, requireLogin: true, draft: true
      }, {
        description: 'Preview Draft Web Form',
        url: ({ xmlFormId }) => `/#/projects/${projectId}/forms/${xmlFormId}/draft/preview`, requireLogin: true, draft: true
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
          await expect(page.getByRole('heading', { name: `${publishedForm.name} - v2`, exact: true })).toBeVisible();
        } else {
          await expect(page.getByRole('heading', { name: publishedForm.name, exact: true })).toBeVisible();
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

  test.describe('redirects to login if 401 on load', async () => {
    const urls = [
      { name: 'hyphen prefix', url: (form) => `/-/${form.enketoId}` },
      { name: 'f prefix', url: (form) => `/f/${form.enketoId}` },
      { name: 'restful', url: (form) => `/projects/${projectId}/forms/${form.xmlFormId}/submissions/new` }
    ];
    urls.forEach(t => {
      test(t.name, async ({ allowedLogs, page }) => {
        allowedLogs.push((msg, message) => {
          if(message !== 'Failed to load resource: the server responded with a status of 401 (Unauthorized)') return;
          const { url } = msg.location();
          return url.startsWith('http://central-test.localhost/v1/form-links/') ||
                 url === `http://central-test.localhost/v1/projects/${projectId}` ||
                 url === `http://central-test.localhost/v1/projects/${projectId}/forms/${form.xmlFormId}` ||
        });

        await page.goto(appUrl + t.url(publishedForm));
        await expect(page.getByRole('heading', { name: 'Welcome to ODK Central' })).toBeVisible();
        await submitLogin(page);
        await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();
      });
    });
  });

  test('allows user to relogin on session expiry during form fill', async ({ page, context }) => {
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

    await page2.getByRole('button', { name: 'close' }).first().click();

    await page2.getByRole('button', { name: 'send' }).click();

    await expect(page2.getByRole('heading', { name: 'successful' })).toBeVisible();
  });
});
