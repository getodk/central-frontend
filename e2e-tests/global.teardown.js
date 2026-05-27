import { test as teardown, expect } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');
const projectId = process.env.PROJECT_ID;

teardown('delete project', async ({ request }) => {
  if (!projectId) return;

  const res = await request.delete(`${appUrl}/v1/projects/${projectId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`
    }
  });

  expect(res).toBeOK();
});
