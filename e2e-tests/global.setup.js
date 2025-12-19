import { test as setup, expect } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');

setup('create new project', async ({ request }) => {
  try {
    const createProjectResponse = await request.post(`${appUrl}/v1/projects`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`
      },
      data: {
        name: `E2E Test - ${(new Date()).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`
      }
    });

    if (createProjectResponse.status() === 401) {
      throw Error(`
        Credentials check failed.

        Confirm that:

          1. the user '${user}' exists, and
          2. their password matches the ODK_PASSWORD env var
      `);
    }

    expect(createProjectResponse).toBeOK();
    const project = await createProjectResponse.json();

    expect(project.id).not.toBeFalsy();
    process.env.PROJECT_ID = project.id;
  } catch (err) {
    if (err.message.includes('ECONNREFUSED')) {
      throw Error(`
        Failed to connect to central-backend.

        Either:

        1. confirm it's running at ${appUrl}, or
        2. update ODK_URL env var to point to the running instance
      `);
    } else {
      throw err;
    }
  }
});
