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
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();

  await page.getByPlaceholder('email address').fill(user);
  await page.getByPlaceholder('password').fill(password);

  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL(appUrl);
};

test.describe('Enketo', () => {
  test.describe('all old URLs should be working', () => {
    const oldUrls = [
      {
        description: 'New Submission',
        url: ({ enketoId }) => `/-/${enketoId}`, requireLogin: true,
        newUrl: ({ xmlFormId }) => `/projects/${projectId}/forms/${xmlFormId}/submissions/new`
      }, {
        description: 'Preview Form',
        url: ({ enketoId }) => `/-/preview/${enketoId}`, requireLogin: true,
        newUrl: ({ xmlFormId }) => `/projects/${projectId}/forms/${xmlFormId}/preview`
      }, {
        description: 'Preview Web Forms',
        url: ({ xmlFormId }) => `/#/projects/${projectId}/forms/${xmlFormId}/preview`, requireLogin: true,
        newUrl: ({ xmlFormId }) => `/projects/${projectId}/forms/${xmlFormId}/preview`
      }, {
        description: 'New Draft Submission',
        url: ({ draftEnketoId }) => `/-/${draftEnketoId}`, requireLogin: true, draft: true,
        newUrl: ({ xmlFormId }) => `/projects/${projectId}/forms/${xmlFormId}/draft/submissions/new`
      }, {
        description: 'Prevew Draft Form',
        url: ({ draftEnketoId }) => `/-/preview/${draftEnketoId}`, requireLogin: true, draft: true,
        newUrl: ({ xmlFormId }) => `/projects/${projectId}/forms/${xmlFormId}/draft/preview`
      }, {
        description: 'Preview Draft Web Form',
        url: ({ xmlFormId }) => `/#/projects/${projectId}/forms/${xmlFormId}/draft/preview`, requireLogin: true, draft: true,
        newUrl: ({ xmlFormId }) => `/projects/${projectId}/forms/${xmlFormId}/draft/preview`
      }, {
        description: 'Public Link',
        url: ({ enketoId, st }) => `/-/single/${enketoId}?st=${st}`, requireLogin: false,
        newUrl: ({ enketoId, st }) => `/f/${enketoId}?st=${st}`
      }, {
        description: 'Single Submission Public Link',
        url: ({ enketoOnceId, st }) => `/-/single/${enketoOnceId}?st=${st}`, requireLogin: false,
        newUrl: ({ enketoOnceId, st }) => `/f/${enketoOnceId}?st=${st}`
      }
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

  test('Edit submission link should be working', async ({ page }) => {
    const { enketoId } = publishedForm;
    const { instanceId } = firstSubmission;

    await login(page);
    await page.goto(`${appUrl}/-/edit/${enketoId}?instance_id=${instanceId}`);
    await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();
  });

  test.describe('offline form', () => {
    const offlineUrls = [{
      description: 'Offline Submissions',
      url: ({ enketoId }) => `/-/x/${enketoId}`, requireLogin: true,
      newUrl: ({ enketoId }) => `/-/x/${enketoId}`
    }, {
      description: 'Offline Submissions Public Link',
      url: ({ enketoId, st }) => `/-/x/${enketoId}?st=${st}`, requireLogin: false,
      newUrl: ({ enketoId, st }) => `/-/x/${enketoId}?st=${st}`
    }];

    offlineUrls.forEach(t => {
      test(`renders offline Form - ${t.url}`, async ({ page }) => {
        const { enketoId, enketoOnceId, xmlFormId } = publishedForm;
        const { enketoId: draftEnketoId } = draftForm;
        const { instanceId } = firstSubmission;
        const { token: st } = publicLink;

        if (t.requireLogin) {
          await login(page);
        }

        await page.goto(appUrl + t.url({ enketoId, enketoOnceId, draftEnketoId, xmlFormId, instanceId, st }));

        await page.waitForURL(appUrl + t.newUrl({ enketoId, enketoOnceId, draftEnketoId, xmlFormId, instanceId, st }));

        await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();

        await expect(page.getByText('A new version of this application has been downloaded. Refresh this page to load the updated version.')).toBeVisible();
      });
    });

    const rejectAllRequests = route => { route.abort('failed'); };

    const goOffline = async (page) => {
      await page.context().setOffline(true);
      await page.route('**', rejectAllRequests);
    };

    const goOnline = async (page) => {
      await page.context().setOffline(false);
      await page.unroute('**', rejectAllRequests);
    };

    test('make offline submission', async ({ page }) => {
      const { enketoId } = publishedForm;

      await login(page);

      await page.goto(`${appUrl}/-/x/${enketoId}`);

      await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();

      await expect(page.getByText('A new version of this application has been downloaded. Refresh this page to load the updated version.')).toBeVisible();

      await page.reload();

      await goOffline(page);

      await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();

      await page.getByLabel('First Name').fill('John Doe');

      await page.getByRole('button', { name: 'submit' }).click();

      await expect(page.getByRole('heading', { name: 'Record queued for submission' })).toBeVisible();

      await page.getByRole('button', { name: 'ok' }).click();

      await expect(page.getByTitle('Records Queued')).toHaveText('1');

      await goOnline(page);

      await expect(page.getByText('successfully submitted')).toBeVisible();

      await expect(page.getByTitle('Records Queued')).toHaveText('0');
    });
  });

  test('restrict multiple submission for single submission public link', async ({ page }) => {
    const singleSubPublicLink = await backendClient.createPublicLink(publishedForm.xmlFormId, true);

    await page.goto(`${appUrl}/-/single/${publishedForm.enketoOnceId}?st=${singleSubPublicLink.token}`);

    let frame = await page.frameLocator('iframe');

    await expect(frame.getByRole('heading', { name: publishedForm.name })).toBeVisible();

    await frame.getByLabel('First Name').fill('John Doe');

    await frame.getByRole('button', { name: 'submit' }).click();

    await expect(frame.getByRole('heading', { name: 'thank you' })).toBeVisible();

    await page.reload();

    frame = await page.frameLocator('iframe');

    await expect(frame.getByRole('heading', { name: 'thank you' })).toBeVisible();

    await expect(frame.getByText('You have already completed this survey.')).toBeVisible();
  });

  test('redirect to custom thank you page', async ({ page }) => {
    await page.goto(`${appUrl}/-/single/${publishedForm.enketoId}?st=${publicLink.token}&returnUrl=http://www.example.com`);

    const frame = await page.frameLocator('iframe');

    await expect(frame.getByRole('heading', { name: publishedForm.name })).toBeVisible();

    await frame.getByLabel('First Name').fill('John Doe');

    await frame.getByRole('button', { name: 'submit' }).click();

    await expect(page.getByRole('heading', { name: 'Example' })).toBeVisible();
  });

  test('allows multiple submission', async ({ page }) => {
    await login(page);

    await page.goto(`${appUrl}/-/${publishedForm.enketoId}`);

    const frame = await page.frameLocator('iframe');

    await expect(frame.getByRole('heading', { name: publishedForm.name })).toBeVisible();

    await frame.getByLabel('First Name').fill('John Doe');

    await frame.getByRole('button', { name: 'submit' }).click();

    await expect(frame.getByRole('heading', { name: 'Successful' })).toBeVisible();

    await frame.locator('form').filter({ hasText: 'Submission SuccessfulYour' }).getByRole('button').click();

    await frame.getByLabel('First Name').fill('Jane Doe');

    await frame.getByRole('button', { name: 'submit' }).click();

    await expect(frame.getByRole('heading', { name: 'Successful' })).toBeVisible();
  });

  test('default value is consistent between rendering enketo directly and via iframe', async ({ page }) => {
    await login(page);

    const queryWithSpaces = '?d[/data/first_name]=hello earth + hello mars %20 hello jupiter %2B hello saturn';

    await page.goto(`${appUrl}/enketo-passthrough/${publishedForm.enketoId}${queryWithSpaces}`);
    await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();

    await expect(page.getByLabel('First Name')).toHaveValue('hello earth + hello mars   hello jupiter + hello saturn');

    await page.goto(`${appUrl}/projects/${projectId}/forms/${publishedForm.xmlFormId}/submissions/new${queryWithSpaces}`);
    const iframe = await page.frameLocator('iframe');
    await expect(iframe.getByRole('heading', { name: publishedForm.name })).toBeVisible();

    // except we transform + into space as well in iframe
    await expect(iframe.getByLabel('First Name')).toHaveValue('hello earth   hello mars   hello jupiter + hello saturn');
  });
});
