import { test as setup, expect } from '@playwright/test';
import { ENCRYPTION_SECRET } from './util';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');

const createProject = async(request, encrypted) => {
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

    if (encrypted) {
      const encryptionResponse = await request.post(`${appUrl}/v1/projects/${project.id}/key`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`
        },
        data: {
          passphrase: ENCRYPTION_SECRET,
          hint: "it was a secret"
        }
      });
      expect(encryptionResponse).toBeOK();
      const getProjectResponse = await request.get(`${appUrl}/v1/projects/${project.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`
        }
      });
      expect(getProjectResponse).toBeOK();
      const getProjectBody = await getProjectResponse.json();
      process.env.ENCRYPTION_KEY_ID = getProjectBody.keyId;
    }
    return project.id;
  } catch (err) {
    if (err.message.includes('ECONNREFUSED')) {
      // eslint-disable-next-line preserve-caught-error
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
};

setup('create new project', async ({ request }) => {
  process.env.PROJECT_ID = await createProject(request, false);
  process.env.PROJECT_ID_ENCRYPTED = await createProject(request, true);
});
