import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableAutoUnmount, mount, flushPromises } from '@vue/test-utils';
import { useRoute, createRouter, createWebHistory, type RouteLocationNormalizedLoadedGeneric } from 'vue-router';
import { i18n } from '../../src/i18n.ts';
import PrimeVue from 'primevue/config';
import Submission from '../../src/components/submission.vue';
import { h } from 'vue';

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRoute: vi.fn(),
  };
});

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
});

describe('Submission', () => {
  enableAutoUnmount(afterEach);
  afterEach(() => {
    vi.resetAllMocks();
  });

  const mountComponent = async () => {
    const component = mount(Submission, {
      global: {
        plugins: [router, i18n, PrimeVue],
        stubs: {
          WebFormRenderer: { render: () => h('div', { class: 'odk-form' }) },
          Dialog: { render: () => h('div', { class: 'p-dialog' }) },
        }
      },
      props: {
        draft: false,
        actionType: 'new'
      },
      params: {
        projectId: 123
      },
    });
    await flushPromises();
    return component;
  };

  interface MockRequestOptions {
    formState: 'closed' | 'closing' | 'open';
  }
  
  describe('given projectid and form id', () => {

    const mockRoute = (name?: string) => {
      vi.mocked(useRoute).mockReturnValue({
        name: name ?? 'SubmissionNew',
        params: { projectId: '123', xmlFormId: 'myform' },
        query: {},
        path: '/submission'
      } as unknown as RouteLocationNormalizedLoadedGeneric);
    };
  
    const mockRequests = (options?: MockRequestOptions) => {
      const fetchMock = vi.fn()
        // get project
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ verbs: ['form.read', 'open_form.read', 'submission.create', 'submission.read', 'submission.update'] }),
        })
        // get form
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            name: 'my form',
            xmlFormId: 'myform',
            projectId: 123,
            enketoId: 'myformenketoid',
            state: options?.formState ?? 'open',
            publishedAt: '2025',
            webformsEnabled: true,
          }),
        })
        // get attachments
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })
        // get form xml
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<root/>'),
        });
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    };

    it('should show ODK Web Form', async () => {
      mockRoute();
      const fetchMock = mockRequests();
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should show dialog when form request 404s', async () => {
      mockRoute();
      const fetchMock = vi.fn()
        // get project
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ verbs: ['form.read', 'open_form.read'] }),
        })
        // get form
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'nope', code: 404 }),
        })
      vi.stubGlobal('fetch', fetchMock);
      const component = await mountComponent();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(false);
      const dialog = component.find('.p-dialog');
      expect(dialog.exists()).to.equal(true);
    });

    it('should show dialog when form is closing', async () => {
      mockRoute();
      const fetchMock = mockRequests({ formState: 'closing' });
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(false);
      const dialog = component.find('.p-dialog');
      expect(dialog.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should show dialog when form is closed', async () => {
      mockRoute();
      const fetchMock = mockRequests({ formState: 'closed' });
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(false);
      const dialog = component.find('.p-dialog');
      expect(dialog.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should show form for draft submissions even when closed', async () => {
      mockRoute('DraftSubmissionNew');
      const fetchMock = mockRequests({ formState: 'closed' });
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('should show form for editing submissions even when closed', async () => {
      mockRoute('SubmissionEdit');
      const fetchMock = mockRequests({ formState: 'closed' });
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });

  describe('given enketoid', () => {

    beforeEach(() => {
      vi.mocked(useRoute).mockReturnValue({
        params: { enketoId: 'abc' },
        query: { st: 'zyx' },
        path: '/f/'
      } as unknown as RouteLocationNormalizedLoadedGeneric);
    })
  
    const mockRequests = (options?: MockRequestOptions) => {
      const fetchMock = vi.fn()
        // get form
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            name: 'my form',
            xmlFormId: 'myform',
            projectId: 123,
            enketoId: 'myformenketoid',
            state: options?.formState ?? 'open',
            publishedAt: '2025',
            webformsEnabled: true,
          }),
        })
        // get attachments
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })
        // get form xml
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<root/>'),
        });
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    };

    it('should show ODK Web Form', async () => {
      const fetchMock = mockRequests();
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should show dialog when form request 404s', async () => {
      const fetchMock = vi.fn()
        // get project
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ verbs: ['form.read', 'open_form.read'] }),
        })
        // get form
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'nope', code: 404 }),
        })
      vi.stubGlobal('fetch', fetchMock);
      const component = await mountComponent();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(false);
      const dialog = component.find('.p-dialog');
      expect(dialog.exists()).to.equal(true);
    });

    it('should show dialog when form is closing', async () => {
      const fetchMock = mockRequests({ formState: 'closing' });
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(false);
      const dialog = component.find('.p-dialog');
      expect(dialog.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should show dialog when form is closed', async () => {
      const fetchMock = mockRequests({ formState: 'closed' });
      const component = await mountComponent();
      const form = component.find('.odk-form');
      expect(form.exists()).to.equal(false);
      const dialog = component.find('.p-dialog');
      expect(dialog.exists()).to.equal(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

});
