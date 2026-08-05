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

  const findCall = (calls: FetchCall[], url: string) => {
    return calls.find(([input]) => getFetchUrl(input) === url);
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

  it('should omit Sentry headers on real form attachment fetches', async () => {
    mount(WebFormRenderer, {
      global: { plugins: [router, PrimeVue, webFormsPlugin] },
      props: {
        xform: formWithAttachmentXml,
        form: {
          name: 'simple',
          xmlFormId: 'simple',
          projectId: 1,
          enketoId: '',
          state: 'open',
          draft: false,
          webformsEnabled: true
        },
        actionType: 'new',
      },
    });
    await flushPromises();

    const calls = fetchSpy.mock.calls as FetchCall[];
    const attachmentCall = calls.find(([input]) => {
      return getFetchUrl(input).includes('/attachments/') && getFetchUrl(input).includes('cities');
    });
    expect(attachmentCall, 'expected the attachment fetch triggered by mount').toBeDefined();

    const headers = readSentryHeaders(attachmentCall!);
    expect(headers['sentry-trace']).toBeNull();
    expect(headers.baggage).toBeNull();
  });

  it('should propagate or omit Sentry headers based on URL pattern', async () => {
    const urlsWithTraceHeaders = [
      '/v1/projects/1/forms/simple',
      '/v1/projects/1/forms/simple/attachments',
      '/v1/projects/1/forms/simple/draft/attachments',
      '/v1/projects/1/forms/simple/submissions/uuid:abc/attachments',
      '/v1/projects/1/forms/attachments/submissions/uuid:abc',
    ];
    await Promise.all(urlsWithTraceHeaders.map((url) => fetch(url)));

    urlsWithTraceHeaders.forEach((url) => {
      const call = findCall(fetchSpy.mock.calls as FetchCall[], url);
      expect(call, `expected a fetch call to ${url}`).toBeDefined();

      const headers = readSentryHeaders(call!);
      expect(headers['sentry-trace'], `Sentry must inject sentry-trace on ${url}`).toBeTruthy();
      expect(headers.baggage, `Sentry must inject baggage on ${url}`).toBeTruthy();
    });

    const urlsWithoutTraceHeaders = [
      '/v1/projects/1/forms/simple/attachments/photo.jpg',
      '/v1/projects/1/forms/simple/draft/attachments/photo.jpg',
      '/v1/projects/1/forms/simple/submissions/uuid:abc/attachments/photo.jpg',
      '/v1/projects/1/forms/simple/submissions/uuid:abc/attachments/photo.jpg?token=xyz',
    ];
    await Promise.all(urlsWithoutTraceHeaders.map((url) => fetch(url)));

    urlsWithoutTraceHeaders.forEach((url) => {
      const call = findCall(fetchSpy.mock.calls as FetchCall[], url);
      expect(call, `expected a fetch call to ${url}`).toBeDefined();

      const headers = readSentryHeaders(call!);
      expect(headers['sentry-trace'], `Sentry must NOT inject sentry-trace on ${url}`).toBeNull();
      expect(headers.baggage, `Sentry must NOT inject baggage on ${url}`).toBeNull();
    });
  });
});
