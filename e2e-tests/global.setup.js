import { test as setup, expect } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');

setup('create new project', async ({ request }) => {
  const createProjectResponse = await request.post(`${appUrl}/v1/projects`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`
    },
    data: {
      name: `E2E Test - ${(new Date()).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`
    }
  });
  expect(createProjectResponse.ok()).toBeTruthy();
  const project = await createProjectResponse.json();

  expect(project.id).not.toBeFalsy();
  process.env.PROJECT_ID = project.id;
});
