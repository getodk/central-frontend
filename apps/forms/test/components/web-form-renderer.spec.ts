import { createRouter, createWebHistory } from 'vue-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableAutoUnmount, mount, VueWrapper } from '@vue/test-utils';
import WebFormRenderer, { type WebFormsRendererProps } from '../../src/components/web-form-renderer.vue';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import Location from '../../src/utils/location';
import { webFormsPlugin } from '@getodk/web-forms';

import simpleForm from '../../../central/test/data/xml/simple/form.xml?raw';
import formWithAttachmentXml from '../../../central/test/data/xml/with-attachment/form.xml?raw';
import imageUploaderXml from '../../../central/test/data/xml/image-uploader/form.xml?raw';
import simpleSubmission from '../../../central/test/data/xml/simple/submission.xml?raw';
import imageUploaderSubmission from '../../../central/test/data/xml/image-uploader/submission.xml?raw';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
})

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  globalInjection: true,
  messages: {
    en: {
      'sendingDataModal.title': () => 'sending',
      'sendingDataModal.body': () => '',
      'action.close': () => 'close',
      'submissionModal.title': () => 'Form successfully sent!',
      'submissionModal.body': () => 'You can fill this Form out again or close if you’re done.',
      'submissionModal.action.fillOutAgain': () => '',
      'sessionTimeoutModal.title': () => 'Session expired',
      // 'sessionTimeoutModal.body.full': () => '',
      'sessionTimeoutModal.body.here': () => 'here',
      'errorModal.title': () => 'Submission error',
      // 'errorModal.body': () => 'error message body'
      'util.request.noResponse': () => 'err',
      'previewModal.title': () => 'Data is valid',
      'previewModal.body': () => 'The data you entered is valid, but it was not submitted because this is a Form preview.',
      'retryModal.title': () => 'Submission error - please try again',
      // 'retryModal.body': () => 'not fully submitted, try again',
      'action.tryAgain': () => 'try again',
      'editSubmissionModal.title': () => 'edit successful',
      'editSubmissionModal.body': () => 'redirecting now...',
      'thankYouModal.title': () => 'cheers!',
      'thankYouModal.body': () => 'successfully submitted through this public link',
    },
  },
});

const mockAssign = vi.fn();

describe('WebFormRenderer', () => {

  enableAutoUnmount(afterEach);
  afterEach(() => {
    vi.resetAllMocks();
  });


  const mountComponent = async (testProps: Partial<WebFormsRendererProps>) => {

    const component = mount(WebFormRenderer, {
      global: {
        plugins: [router, i18n, PrimeVue, webFormsPlugin]
      },
      props: {
        xform: testProps.xform!,
        form: { name: 'simple', xmlFormId: 'simple', projectId: 1, enketoId: '', state: 'open', draft: false, webformsEnabled: true },
        actionType: testProps.actionType ?? 'new',
        instanceId: testProps.instanceId ?? null,
        submissionAttachments: testProps.submissionAttachments ?? null,
        st: testProps.st ?? null
      }
    });
    await flushPromises();
    return component;
  };

  const submit = async (component: VueWrapper) => {
    await component.find('.odk-form .footer button').trigger('click');
    await vi.waitFor(() => {
      const el = document.querySelector('.p-dialog-header');
      if (!el) throw new Error('Not ready yet');
    });
  };

  // Minimal valid 1x1 pixel GIF
  const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const gifBinary = atob(gifBase64);
  const gifBytes = Uint8Array.from(gifBinary, c => c.charCodeAt(0));

  const uploadOnePixelGif = async (component) => {
    const setFiles = (wrapper, files:File[]) => {
      const dt = new DataTransfer();
      for (const file of files) {
        dt.items.add(file);
      }
      wrapper.element.files = dt.files;
      return wrapper.trigger('change');
    };

    const fileToUpload = new File([gifBytes], '1746140510984.gif', { type: 'image/gif' });
    await setFiles(component.find('.odk-form input[type="file"]'), [fileToUpload]);
  };

  it('should show ODK Web Form', async () => {
    const component = await mountComponent({ xform: simpleForm });
    const form = component.find('.odk-form');
    expect(form.exists()).to.equal(true);
  });

  it('should load form attachments', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('name,label\ntoronto,Toronto'),
    } as Response);
    const component = await mountComponent({ xform: formWithAttachmentXml});
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const form = component.find('.odk-form');
    expect(form.exists()).to.equal(true);
    expect(form.text()).to.match(/Toronto/);
    fetchSpy.mockReset();
  });

  it('should send submission xml request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ instanceId: 1 }),
    } as Response);
    const component = await mountComponent({ xform: simpleForm });
    await submit(component);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls.length).to.equal(1);
    const firstCall = fetchSpy.mock.calls[0]!;
    const url = firstCall[0];
    const args = firstCall[1]!;
    expect(url).to.equal(`/v1/projects/1/forms/simple/submissions`);
    expect(args.method).to.equal('POST');
    expect(args.headers!['Content-Type']).to.equal('text/xml');
    expect((args.body as File).name).to.equal('xml_submission_file');
    fetchSpy.mockReset();
  });

  it('should show success modal after submission request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ instanceId: 1 }),
    } as Response);
    const component = await mountComponent({ xform: simpleForm });
    await submit(component);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const title = document.querySelector('.p-dialog-header span')!;
    const intro = document.querySelector('.p-dialog-content span')!;
    expect(title.textContent).to.equal('Form successfully sent!');
    expect(intro.textContent).to.equal('You can fill this Form out again or close if you’re done.');
  });

  it('should submit st token with public form submission', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ instanceId: 1 }),
    } as Response);
    const component = await mountComponent({ xform: simpleForm, st: 'sometoken', actionType: 'public-link' });
    await submit(component);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls.length).to.equal(1);
    const firstCall = fetchSpy.mock.calls[0]!;
    const url = firstCall[0];
    const args = firstCall[1]!;
    expect(url).to.equal(`/v1/projects/1/forms/simple/submissions?st=sometoken`);
    expect(args.method).to.equal('POST');
    const title = document.querySelector('.p-dialog-header span')!;
    const intro = document.querySelector('.p-dialog-content span')!;
    expect(title.textContent).to.equal('cheers!');
    expect(intro.textContent).to.equal('successfully submitted through this public link');
  });

  it('should attach st query param for public links', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ instanceId: 1 }),
    } as Response);
    const component = await mountComponent({ xform: simpleForm });
    await submit(component);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const title = document.querySelector('.p-dialog-header span')!;
    const intro = document.querySelector('.p-dialog-content span')!;
    expect(title.textContent).to.equal('Form successfully sent!');
    expect(intro.textContent).to.equal('You can fill this Form out again or close if you’re done.');
  });

  it('clears the form on Fill out again button', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ instanceId: 1 }),
    } as Response);
    const component = await mountComponent({ xform: simpleForm });
    const input = component.find('input');
    await input.setValue('test');
    expect(component.find('input').element.value).to.equal('test');
    await submit(component);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const title = document.querySelector('.p-dialog-header span')!;
    const intro = document.querySelector('.p-dialog-content span')!;
    expect(title.textContent).to.equal('Form successfully sent!');
    expect(intro.textContent).to.equal('You can fill this Form out again or close if you’re done.');

    const button = document.querySelector('.p-dialog [type=button]')!;
    (button as HTMLButtonElement).click();

    expect(component.find('input').element.value).to.equal('');
  });

  it('should show error modal in case of submission failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ code: 409.1, message: 'duplication instance ID' }),
    } as Response);
    const component = await mountComponent({ xform: simpleForm });
    const input = component.find('input');
    await input.setValue('test');
    expect(component.find('input').element.value).to.equal('test');
    await submit(component);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const title = document.querySelector('.p-dialog-header span')!;
    expect(title.textContent).to.equal('Submission error');
    // TODO something isn't working in the template translations
    // const intro = document.querySelector('.p-dialog-content')!;
    // expect(intro.textContent).to.match(/Your data was not submitted.*duplication instance ID/);
  });

  it('should show sessionTimeout modal in case of session expiry', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 401.2, message: 'timeout' }),
    } as Response);
    const component = await mountComponent({ xform: simpleForm });
    const input = component.find('input');
    await input.setValue('test');
    expect(component.find('input').element.value).to.equal('test');
    await submit(component);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const title = document.querySelector('.p-dialog-header span')!;
    expect(title.textContent).to.equal('Session expired');

    const button = document.querySelector('.p-dialog .p-dialog-close-button');
    expect(button).toBeDefined();

    // TODO something isn't working in the template translations
    // const intro = document.querySelector('.p-dialog-content')!;
    // expect(intro.textContent).to.equal('Please log in here in a different browser tab and try again.');
  });

  it('shows preview modal', async () => {
    const component = await mountComponent({ xform: simpleForm, actionType: 'preview' });
    const input = component.find('input');
    await input.setValue('test');
    await submit(component);
    const title = document.querySelector('.p-dialog-header span')!;
    expect(title.textContent).to.equal('Data is valid');
    const intro = document.querySelector('.p-dialog-content')!;
    expect(intro.textContent).to.equal('The data you entered is valid, but it was not submitted because this is a Form preview.');
  });

  it('should show loading modal', async () => {
    let resolvePromise;

    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return pendingPromise.then(() => new Response(JSON.stringify({ data: 'success' })));
    });
    const component = await mountComponent({ xform: simpleForm });
    const input = component.find('input');
    await input.setValue('test');
    await submit(component);
    const title = document.querySelector('.p-dialog-header span')!.textContent;
    expect(title).to.equal('sending');
    resolvePromise({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should send submission attachment request - relies on OWF', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ instanceId: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ name: 'mypic', result: 200 }),
      } as Response);
    const component = await mountComponent({ xform: imageUploaderXml });
    await uploadOnePixelGif(component);
    await submit(component);
    const title = document.querySelector('.p-dialog-header span')!;
    const intro = document.querySelector('.p-dialog-content span')!;
    expect(title.textContent).to.equal('Form successfully sent!');
    expect(intro.textContent).to.equal('You can fill this Form out again or close if you’re done.');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should show retry modal if attachment upload fails - relies on OWF', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ instanceId: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false
      } as Response);
    const component = await mountComponent({ xform: imageUploaderXml });
    await uploadOnePixelGif(component);
    await submit(component);
    const title = document.querySelector('.p-dialog-header span')!;
    expect(title.textContent).to.equal('Submission error - please try again');
    // const intro = document.querySelector('.p-dialog-content span')!;
    // expect(intro.textContent).to.match(/Your data was not fully submitted.*Please press the “Try again” button to retry/);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should send only submission attachment request on retry', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ instanceId: 1 }),
      } as Response)
      // fails first time
      .mockResolvedValueOnce({
        ok: false
      } as Response)
      // succeeds on retry
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ name: 'mypic', result: 200 }),
      } as Response);
    const component = await mountComponent({ xform: imageUploaderXml });
    await uploadOnePixelGif(component);
    await submit(component);
    let title;
    title = document.querySelector('.p-dialog-header span')!;
    expect(title.textContent).to.equal('Submission error - please try again');
    const button = document.querySelector('.p-dialog [type=button]')!;
    (button as HTMLButtonElement).click();
    await vi.waitFor(() => {
      title = document.querySelector('.p-dialog-header span')!;
      expect(title.textContent).to.equal('Form successfully sent!');
    });

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('should show non-hideable sessionTimeout modal if attachment upload fails during session expiry - relies on OWF', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ instanceId: 1 }),
      } as Response)
      // session timeout first time
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ code: 401.2, message: 'timeout' }),
      } as Response);
    const component = await mountComponent({ xform: imageUploaderXml });
    await uploadOnePixelGif(component);
    await submit(component);
    const title = document.querySelector('.p-dialog-header span')!;
    expect(title.textContent).to.equal('Session expired');

    const button = document.querySelector('.p-dialog .p-dialog-close-button');
    expect(button).toBeNull();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  describe('edit', () => {

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should load submission instance for edits', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(simpleSubmission),
        } as Response);
      const component = await mountComponent({
        xform: simpleForm,
        actionType: 'edit',
        instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25',
        submissionAttachments: []
      });
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(true);
    });

    it('should send PUT submission request on send button and redirect', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(simpleSubmission),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ currentVersion: { instanceId: '123' } }),
        } as Response);
      const component = await mountComponent({
        xform: simpleForm,
        actionType: 'edit',
        instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25',
        submissionAttachments: []
      });
      await submit(component);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const putCall = fetchSpy.mock.calls[1]!;
      const url = putCall[0];
      const args = putCall[1]!;
      expect(url).to.equal(`/v1/projects/1/forms/simple/submissions/uuid:01f165e1-8814-43b8-83ec-741222b00f25`);
      expect(args.method).to.equal('PUT');

      vi.spyOn(Location, 'assign').mockImplementation(mockAssign);

      const title = document.querySelector('.p-dialog-header span')!;
      expect(title.textContent).to.equal('edit successful');

      vi.advanceTimersByTime(2000);

      expect(mockAssign).toHaveBeenCalledTimes(1);
      const firstCall = mockAssign.mock.calls[0]!;
      const submissionUrl = firstCall[0].toString();
      const expectedUrl = `${window.location.protocol}//${window.location.host}/projects/1/forms/simple/submissions/uuid:01f165e1-8814-43b8-83ec-741222b00f25`;
      expect(submissionUrl).to.equal(expectedUrl);
    });

    it('should make requests for attachment data - relies on OWF', async () => {
      const response = await fetch(gifBinary);
      const blob = await response.blob();
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        // get the submission xml
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(imageUploaderSubmission),
        } as Response)
        // get the attachment
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          blob: () => Promise.resolve(blob),
        } as Response);
      const component = await mountComponent({
        xform: imageUploaderXml,
        actionType: 'edit',
        instanceId: 'uuid:01f165e1-8814-43b8-83ec-741222b00f25',
        submissionAttachments: ['1746140510984.jpg']
      });
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(true);
      const heading = component.find('.odk-form h1').text();
      expect(heading).to.equal('Display Picture');
    });

  });

});
