import { useLocale, type Translate } from '@/lib/locale/useLocale.ts';
import type { FormLanguage, RootNode } from '@getodk/xforms-engine';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref, type VNode } from 'vue';
import { globalMountOptions } from '../../helpers.ts';

const englishFormRef = (): Ref<RootNode | null> => {
  const languages: FormLanguage[] = [
    { isDefault: true, language: 'English', locale: new Intl.Locale('en') },
  ];
  return ref({ languages, setLanguage: vi.fn() }) as unknown as Ref<RootNode | null>;
};

const renderWithTranslate = async (render: (t: Translate) => VNode): Promise<VueWrapper> => {
  const TestComponent = defineComponent({
    setup() {
      const { t } = useLocale(englishFormRef());
      return () => render(t);
    },
  });
  const wrapper = mount(TestComponent, { global: globalMountOptions });
  await flushPromises();
  return wrapper;
};

describe('POC: apps/forms translation patterns via @formatjs/intl', () => {
  const wrappers: VueWrapper[] = [];

  const render = async (fn: (t: Translate) => VNode) => {
    const wrapper = await renderWithTranslate(fn);
    wrappers.push(wrapper);
    return wrapper;
  };

  afterEach(() => {
    wrappers.forEach((w) => w.unmount());
    wrappers.length = 0;
    vi.restoreAllMocks();
  });

  it('plain interpolation renders substituted text', async () => {
    const wrapper = await render((t) =>
      h('span', null, t('poc_sharing.error_status', { status: 500 }))
    );

    expect(wrapper.text()).toBe('Error code: 500');
  });

  it('inline tag placeholder renders an anchor with inline text', async () => {
    const wrapper = await render((t) =>
      h(
        'p',
        null,
        t('poc_sharing.session_timeout', {
          loginLink: (chunks) => h('a', { href: '/login', target: '_blank' }, chunks),
        })
      )
    );

    const anchor = wrapper.get('a');
    expect(anchor.text()).toBe('here');
    expect(anchor.attributes('href')).toBe('/login');
    expect(anchor.attributes('target')).toBe('_blank');
    expect(wrapper.text()).toBe('Please log in here in a different browser tab and try again.');
  });

  it('two tag placeholders render VNodes in order, one wrapping a dynamic primitive', async () => {
    const wrapper = await render((t) =>
      h(
        'p',
        null,
        t('poc_sharing.error_modal.body', {
          // primitive substituted first, then wrapped by the <errorBox> tag
          errorMessage: 'Something failed',
          errorBox: (chunks) => h('pre', null, chunks),
          supportEmail: (chunks) => h('a', { href: 'mailto:support@getodk.org' }, chunks),
        })
      )
    );

    expect(wrapper.get('pre').text()).toBe('Something failed');

    const anchor = wrapper.get('a');
    expect(anchor.text()).toBe('support@getodk.org');
    expect(anchor.attributes('href')).toBe('mailto:support@getodk.org');

    expect(wrapper.text()).toBe(
      'Your data was not submitted. Error message: Something failed You can close this dialog and try again. If the error keeps happening, please contact the person who asked you to fill this Form or support@getodk.org.'
    );
  });
});
