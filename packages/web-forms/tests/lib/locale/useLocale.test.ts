import { normalizeMessages, STORAGE_KEY, useLocale } from '@/lib/locale/useLocale.ts';
import type { FormLanguage, RootNode } from '@getodk/xforms-engine';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref, type Ref } from 'vue';
import { globalMountOptions } from '../../helpers.ts';

describe('useLocale', () => {
	// Track wrappers to explicitly unmount them and prevent
	// onUnmounted state pollution (document.documentElement.lang) across tests
	let wrappers: Array<ReturnType<typeof mount>> = [];

	const makeLanguage = (language: string, localeCode: string, isDefault = false): FormLanguage => ({
		isDefault,
		language,
		locale: new Intl.Locale(localeCode),
	});

	const makeFormRef = (languages: FormLanguage[]): Ref<RootNode | null> =>
		ref({ languages, setLanguage: vi.fn() }) as unknown as Ref<RootNode | null>;

	const mountLocale = (formRef: Ref<RootNode | null>) => {
		let locale: ReturnType<typeof useLocale> | undefined;

		const TestComponent = defineComponent({
			setup() {
				locale = useLocale(formRef);
				return {};
			},
			template: '<div />',
		});

		const wrapper = mount(TestComponent, { global: globalMountOptions });
		wrappers.push(wrapper);

		return { wrapper, getLocale: () => locale! };
	};

	beforeEach(() => {
		localStorage.removeItem(STORAGE_KEY as string);
		document.documentElement.removeAttribute('lang');
	});

	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.removeItem(STORAGE_KEY as string);

		wrappers.forEach((w) => w.unmount());
		wrappers = [];
	});

	describe('language priority order (saved > designer default > browser > first)', () => {
		it('prefers saved locale over browser language', () => {
			localStorage.setItem(STORAGE_KEY as string, 'fr');
			vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en']);

			const formRef = makeFormRef([makeLanguage('English', 'en'), makeLanguage('French', 'fr')]);
			mountLocale(formRef);

			expect(document.documentElement.lang).toBe('fr');
		});

		it('prefers designer default over browser language when no saved locale', () => {
			vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en']);

			const formRef = makeFormRef([
				makeLanguage('English', 'en'),
				makeLanguage('French', 'fr', true),
			]);
			mountLocale(formRef);

			expect(document.documentElement.lang).toBe('fr');
		});

		it('uses browser language when no saved locale and no designer default', () => {
			vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['jp']);

			const formRef = makeFormRef([makeLanguage('English', 'en'), makeLanguage('Japanese', 'jp')]);
			mountLocale(formRef);

			expect(document.documentElement.lang).toBe('jp');
		});

		it('falls back to first available language when no saved locale, no designer default, and no browser match', () => {
			vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de']);

			const formRef = makeFormRef([makeLanguage('English', 'en'), makeLanguage('French', 'fr')]);
			mountLocale(formRef);

			expect(document.documentElement.lang).toBe('en');
		});
	});

	describe('findFormLanguage base language matching', () => {
		it('matches form language by base language when exact locale is not available', () => {
			vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-CA']);

			const formRef = makeFormRef([makeLanguage('English', 'en'), makeLanguage('French', 'fr')]);
			mountLocale(formRef);

			expect(document.documentElement.lang).toBe('fr');
		});

		it('prefers exact locale match over base language match', () => {
			vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-CA']);

			const formRef = makeFormRef([
				makeLanguage('French', 'fr'),
				makeLanguage('French (Canada)', 'fr-CA'),
			]);
			mountLocale(formRef);

			expect(document.documentElement.lang).toBe('fr-CA');
		});
	});

	describe('resolveLocale translation fallback', () => {
		it('loads base locale translations when exact locale has no translation file', async () => {
			document.documentElement.lang = 'fr';
			const formRef = makeFormRef([makeLanguage('English (Fictional Region)', 'en-ZZ')]);
			const { getLocale } = mountLocale(formRef);

			await flushPromises();

			expect(getLocale().t('odk_web_forms.submit.label')).toBe('Send');
			expect(document.documentElement.lang).toBe('en-ZZ');
		});

		it('falls back to English when no translation file exists for locale', async () => {
			const formRef = makeFormRef([makeLanguage('Fictional Language', 'zz')]);
			const { getLocale } = mountLocale(formRef);

			await flushPromises();

			expect(getLocale().t('odk_web_forms.submit.label')).toBe('Send');
		});
	});

	describe('normalizeMessages - empty string handling', () => {
		it('does not include empty translated strings', () => {
			const result = normalizeMessages({ 'odk_web_forms.submit.label': { string: '' } });

			expect(result['odk_web_forms.submit.label']).toBeUndefined();
		});

		it('includes non-empty translated strings', () => {
			const result = normalizeMessages({
				'odk_web_forms.geolocation.error': { string: 'Localisation indisponible.' },
			});

			expect(result['odk_web_forms.geolocation.error']).toBe('Localisation indisponible.');
		});

		it('empty strings do not override English fallback when merged', () => {
			const enMessages = { 'odk_web_forms.submit.label': 'Send' };
			const frNormalized = normalizeMessages({ 'odk_web_forms.submit.label': { string: '' } });
			const merged = { ...enMessages, ...frNormalized };

			expect(merged['odk_web_forms.submit.label']).toBe('Send');
		});

		it('non-empty strings override English fallback when merged', () => {
			const enMessages = { 'odk_web_forms.submit.label': 'Send' };
			const frNormalized = normalizeMessages({
				'odk_web_forms.submit.label': { string: 'Envoyer' },
			});
			const merged = { ...enMessages, ...frNormalized };

			expect(merged['odk_web_forms.submit.label']).toBe('Envoyer');
		});

		it('normalizes plain string values', () => {
			const result = normalizeMessages({ key: 'plain string' });

			expect(result['key']).toBe('plain string');
		});
	});
});
