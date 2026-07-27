import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import { flushPromises, mount } from '@vue/test-utils';
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import { webFormsPlugin } from '@getodk/web-forms';
import { getClient } from '@sentry/vue';
import WebFormRenderer from '../../src/components/web-form-renderer.vue';
import initSentry from '../../src/utils/sentry';

type FetchCall = [input: RequestInfo | URL, init?: RequestInit];

describe('Sentry headers', () => {
  const formWithAttachmentXml = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>t</h:title>
    <model>
      <instance>
        <data id="t">
          <meta><instanceID/></meta>
          <city/>
        </data>
      </instance>
      <instance id="cities" src="jr://file-csv/cities.csv"/>
      <bind nodeset="/data/meta/instanceID" type="string" calculate="'x'"/>
      <bind nodeset="/data/city" type="string"/>
    </model>
  </h:head>
  <h:body>
    <select1 ref="/data/city">
      <label>c</label>
      <itemset nodeset="instance('cities')/root/item">
        <value ref="name"/>
        <label ref="label"/>
      </itemset>
    </select1>
  </h:body>
</h:html>`;

  const getFetchUrl = (input: RequestInfo | URL): string => {
    if (typeof input === 'string') {
      return input;
    }
    return input instanceof URL ? input.toString() : input.url;
  };

  const readSentryHeaders = ([, init]: FetchCall) => {
    const headers = new Headers(init?.headers);
    return { 'sentry-trace': headers.get('sentry-trace'), baggage: headers.get('baggage') };
  };

  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
  });

  // Spy must be set before initSentry so Sentry wraps the spy and we can catch the request headers.
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve('name,label\ntoronto,Toronto'),
  } as Response);

  beforeAll(() => {
    initSentry(createApp({ render: () => null }), 'web-forms-test', 'https://fake@sentry.io/1');
  });

  afterAll(async () => {
    await getClient()?.close();
    fetchSpy.mockRestore();
  });

  it('should omits Sentry headers on attachment requests', async () => {
    // Loading the form triggers the request to fetch attachments. Sentry should not attach headers.
    mount(WebFormRenderer, {
      global: { plugins: [router, PrimeVue, webFormsPlugin] },
      props: {
        xform: formWithAttachmentXml,
        form: { name: 'simple', xmlFormId: 'simple', projectId: 1, enketoId: '', state: 'open', draft: false, webformsEnabled: true },
        actionType: 'new',
      },
    });

    await flushPromises();
    // Positive control: proves Sentry's fetch instrumentation is active.
    await fetch('/v1/projects/1/forms/simple');

    const calls = fetchSpy.mock.calls as FetchCall[];
    const controlCall = calls.find(([input]) => getFetchUrl(input).endsWith('/v1/projects/1/forms/simple'));
    expect(controlCall).toBeDefined();

    const controlHeaders = readSentryHeaders(controlCall!);
    expect(controlHeaders['sentry-trace'], 'Sentry must inject sentry-trace on non-attachment URLs').toBeTruthy();
    expect(controlHeaders.baggage, 'Sentry must inject baggage on non-attachment URLs').toBeTruthy();

    const attachmentCall = calls.find(([input]) => getFetchUrl(input).includes('/attachments/'));
    expect(attachmentCall).toBeDefined();

    const attachmentHeaders = readSentryHeaders(attachmentCall!);
    expect(attachmentHeaders['sentry-trace'], 'Sentry must NOT inject sentry-trace on attachment URLs').toBeNull();
    expect(attachmentHeaders.baggage, 'Sentry must NOT inject baggage on attachment URLs').toBeNull();
  });
});
