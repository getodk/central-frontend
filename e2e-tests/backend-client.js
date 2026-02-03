import { expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');
const projectId = process.env.PROJECT_ID;

export default class BackendClient {
  #request;
  #playwright;
  #prefix;

  constructor(playwright, prefix) {
    this.#playwright = playwright;
    this.#prefix = prefix;
  }

  async #getRequest() {
    if (!this.#request) {
      this.#request = await this.#playwright.request.newContext({
        baseURL: appUrl,
        extraHTTPHeaders: {
          Authorization: `Basic ${credentials}`
        },
      });
    }
    return this.#request;
  }

  createForm = async () => {
    const formTemplate = fs.readFileSync(path.join(__dirname, './data/form.template.xml'), 'utf8');
    const request = await this.#getRequest();

    const response = await request.post(`/v1/projects/${projectId}/forms?publish=true`, {
      headers: {
        'content-type': 'application/xml',
      },
      data: formTemplate
        .replaceAll('{{ formId }}', `${this.#prefix}_${faker.word.noun()}`)
    });
    expect(response).toBeOK();
    return response.json();
  };

  createSubmission = async (xmlFormId) => {
    const submissionTemplate = fs.readFileSync(path.join(__dirname, './data/submission.template.xml'), 'utf8');
    const request = await this.#getRequest();
    const response = await request.post(`/v1/projects/${projectId}/forms/${xmlFormId}/submissions`, {
      headers: {
        'content-type': 'application/xml',
      },
      data: submissionTemplate
        .replace('{{ uuid }}', randomUUID())
        .replace('{{ firstName }}', faker.person.firstName())
        .replace('{{ formId }}', xmlFormId)
    });
    expect(response).toBeOK();
    return response.json();
  };

  editSubmission = async (xmlFormId, instanceId) => {
    const request = await this.#getRequest();
    const response = await request.get(`/v1/projects/${projectId}/forms/${xmlFormId}/submissions/${instanceId}/edit`);
    expect(response).toBeOK();
  };

  createDraftVersion = async (xmlFormId, version = 'v2') => {
    const formTemplate = fs.readFileSync(path.join(__dirname, './data/form.template.xml'), 'utf8');
    const request = await this.#getRequest();
    const response = await request.post(`/v1/projects/${projectId}/forms/${xmlFormId}/draft`, {
      headers: {
        'content-type': 'application/xml',
      },
      data: formTemplate
        .replaceAll('{{ formId }}', xmlFormId)
        .replace('<data', `<data version="${version}"`)
        .replace('</h:title>', ` - ${version}</h:title>`)
    });
    expect(response).toBeOK();

    const getResponse = await request.get(`/v1/projects/${projectId}/forms/${xmlFormId}/draft`);
    expect(getResponse).toBeOK();
    return getResponse.json();
  };

  createPublicLink = async (xmlFormId, once = false) => {
    const request = await this.#getRequest();
    const response = await request.post(`/v1/projects/${projectId}/forms/${xmlFormId}/public-links`, {
      data: {
        displayName: faker.word.noun(),
        once
      }
    });
    expect(response).toBeOK();
    return response.json();
  };

  setWebForms = async (xmlFormId, enable) => {
    const request = await this.#getRequest();
    const response = await request.patch(`/v1/projects/${projectId}/forms/${xmlFormId}`, {
      data: {
        webformsEnabled: enable
      }
    });
    expect(response).toBeOK();
  };

  createFormAndChildren = async () => {
    const form = await this.createForm();
    const submission = await this.createSubmission(form.xmlFormId);
    await this.editSubmission(form.xmlFormId, submission.instanceId);
    const formDraft = await this.createDraftVersion(form.xmlFormId);
    const publicLink = await this.createPublicLink(form.xmlFormId);

    return {
      form,
      submission,
      formDraft,
      publicLink
    };
  };

  alwaysHideModal = async () => {
    const request = await this.#getRequest();
    const response = await request.put('/v1/user-preferences/site/whatsNewDismissed2025_4', {
      data: { propertyValue: true }
    });
    expect(response.ok()).toBeTruthy();
  };

  async dispose() {
    await this.#request.dispose();
  }
}
