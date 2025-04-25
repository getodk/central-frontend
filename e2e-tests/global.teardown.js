import { test as teardown, expect } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');
const projectId = process.env.PROJECT_ID;

teardown('delete project', async () => {
  const result = await fetch(`${appUrl}/v1/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`
    }
  })
    .then(res => res.json())
    .then(r => r.success);

  expect(result).toEqual(true);
});
