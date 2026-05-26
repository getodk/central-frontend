import { test as teardown, expect } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');
const projectId = process.env.PROJECT_ID;
const projectIdEncrypted = process.env.PROJECT_ID_ENCRYPTED;

teardown('delete project', async () => {
  const promises = [ projectId, projectIdEncrypted ].map((project) => {
    return fetch(`${appUrl}/v1/projects/${project}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`
      }
    })
      .then(res => res.json())
      .then(res => res.success);
  });
  const results = await Promise.allSettled(promises);
  results.forEach(result => expect(result.value).toEqual(true));
});
