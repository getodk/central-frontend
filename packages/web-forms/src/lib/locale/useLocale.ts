import { createIntl, type IntlShape } from '@formatjs/intl';
import type { FormLanguage, RootNode } from '@getodk/xforms-engine';
import { all as primeLocales } from 'primelocale';
import { usePrimeVue } from 'primevue/config';
import type { Ref } from 'vue';
import { computed, onUnmounted, shallowRef, watch } from 'vue';
// English strings always available as language fallback
import enRaw from '@locales/strings_en.json';

export type TranslateValues = NonNullable<Parameters<IntlShape['formatMessage']>[1]>;
export type Translate = (id: string, values?: TranslateValues) => string;
type TransifexTranslation = Record<string, string | { string: string }>;
type ICUMessage = Record<string, string>;

const FALLBACK = 'en';
export const STORAGE_KEY = 'odk-web-forms-locale';

const availableTranslations = import.meta.glob<{ default: TransifexTranslation }>(
	'@locales/strings_*.json'
);

/**
 * Transifex exports messages wrapped in an object (e.g., `{ string: "..." }`).
 * This flattens them into a consistent key-value pair.
 */
export const normalizeMessages = (raw: TransifexTranslation): ICUMessage => {
	const result: ICUMessage = {};

	for (const key in raw) {
		const message = raw[key];
		const value = typeof message === 'string' ? message : message?.string;
		if (value) {
			result[key] = value;
		}
	}

	return result;
};

const enMessages = normalizeMessages(enRaw as TransifexTranslation);

const loadMessages = async (locale: string): Promise<ICUMessage> => {
	if (locale === FALLBACK) {
		return enMessages;
	}

	try {
		const raw = await availableTranslations[`/locales/strings_${locale}.json`]!();
		return { ...enMessages, ...normalizeMessages(raw.default) };
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn(`Failed to load messages for locale "${locale}", falling back to English:`, error);
		return enMessages;
	}
};

const baseLanguage = (code: string): string => code.split('-')[0] ?? code;

const findBestLocale = (candidates: string[], isAvailable: (l: string) => boolean): string => {
	for (const candidate of candidates) {
		if (isAvailable(candidate)) {
			return candidate;
		}
	}
	// Regional language falls back to base ("en") if no exact match was found.
	for (const candidate of candidates) {
		const base = baseLanguage(candidate);
		if (base !== candidate && isAvailable(base)) {
			return base;
		}
	}
	return FALLBACK;
};

const findFormLanguage = (languages: FormLanguage[], localeCode: string | null | undefined) => {
	if (!localeCode?.length || !languages.length) {
		return;
	}

	const exactMatch = languages.find((lang) => lang.locale?.baseName === localeCode);
	if (exactMatch) {
		return exactMatch;
	}

	// Fall back to base language match (e.g. "en" matches "en-US")
	return languages.find((lang) => {
		return lang.locale?.baseName && baseLanguage(lang.locale.baseName) === baseLanguage(localeCode);
	});
};

/**
 * Returns an ordered list of locale candidates for the UI (PrimeVue, messages).
 * When a form language is provided (e.g. "en"), browser languages that share the same base are prepended
 * so regional date formats are preferred. If no form language is given, the full browser list is used.
 */
const resolveUILocaleCandidates = (formLanguage?: FormLanguage): string[] => {
	const browserLanguages = Array.from(navigator.languages ?? [navigator.language]);
	const formLocale = formLanguage?.locale?.baseName;

	if (formLocale?.length) {
		const formBase = baseLanguage(formLocale);
		const sameBaseLocales = browserLanguages.filter((lang) => baseLanguage(lang) === formBase);
		if (!sameBaseLocales.includes(formLocale)) {
			sameBaseLocales.push(formLocale);
		}
		return sameBaseLocales;
	}

	if (!browserLanguages.includes(FALLBACK)) {
		browserLanguages.push(FALLBACK);
	}
	return browserLanguages;
};

const findDefaultFormLanguage = (languages: FormLanguage[]) => {
	return languages.find((lang) => lang.isDefault);
};

const findBrowserFormLanguage = (languages: FormLanguage[]) => {
	const browserLanguages = navigator.languages ?? [navigator.language];
	for (const lang of browserLanguages) {
		const found = findFormLanguage(languages, lang);
		if (found) {
			return found;
		}
	}
};

const findSavedFormLanguage = (languages: FormLanguage[]) => {
	try {
		return findFormLanguage(languages, localStorage.getItem(STORAGE_KEY));
	} catch {
		// localStorage access can fail in sandboxed iframes.
		return null;
	}
};

const isSupportedFormLanguage = (
	languages: FormLanguage[],
	formLanguage: FormLanguage | undefined
): formLanguage is FormLanguage => {
	if (!formLanguage?.language.length || !languages.length) {
		return false;
	}

	return languages.some((lang) => {
		return (
			lang.language === formLanguage.language &&
			lang.locale?.baseName === formLanguage.locale?.baseName
		);
	});
};

export const useLocale = (formRef: Ref<RootNode | null>) => {
	const primevue = usePrimeVue();
	const currentIntl = shallowRef(
		createIntl({ locale: FALLBACK, messages: enMessages, defaultLocale: FALLBACK })
	);
	const latestRequestedLocale = { locale: FALLBACK };
	// SyntheticDefaultLanguage is a placeholder used when a form has no defined languages, not a real selectable language.
	const formLanguages = computed(() => {
		return formRef.value?.languages.filter((lang) => !lang.isSyntheticDefault) ?? [];
	});

	const setLanguage = (formLanguage: FormLanguage | undefined) => {
		if (!isSupportedFormLanguage(formLanguages.value, formLanguage)) {
			return;
		}

		const candidateLocales = resolveUILocaleCandidates(formLanguage);
		const formBaseLocale = formLanguage.locale?.baseName;
		applyLocale(candidateLocales, formBaseLocale);
		formRef.value?.setLanguage(formLanguage);

		if (formBaseLocale?.length) {
			try {
				localStorage.setItem(STORAGE_KEY, formBaseLocale);
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn("Failed to save the user's locale preference to localStorage:", error);
			}
		}
	};

	const applyLocale = (candidates: string[], formBaseLocale?: string) => {
		const newContentLocale = formBaseLocale ?? FALLBACK;
		document.documentElement.lang = newContentLocale;
		latestRequestedLocale.locale = newContentLocale;
		const primeLocaleKey = findBestLocale(candidates, (lang) => {
			return Object.hasOwn(primeLocales, lang);
		});
		const primeLocale = primeLocales[primeLocaleKey as keyof typeof primeLocales];
		if (primeLocale) {
			primevue.config.locale = { ...primevue.config.locale, ...primeLocale };
		}

		const messagesLocale = findBestLocale(candidates, (lang) => {
			return Object.hasOwn(availableTranslations, `/locales/strings_${lang}.json`);
		});
		void loadMessages(messagesLocale).then((messages) => {
			if (latestRequestedLocale.locale === newContentLocale) {
				currentIntl.value = createIntl({
					locale: messagesLocale,
					messages,
					defaultLocale: FALLBACK,
				});
			}
		});
	};

	watch(
		formLanguages,
		(langs) => {
			if (!langs.length) {
				// No form languages found (loading error or empty form).
				// Skipping persisted locale: without form context the user can't change language,
				// the saved preference stays untouched for the next form load.
				applyLocale(resolveUILocaleCandidates());
				return;
			}
			const formLanguage =
				findSavedFormLanguage(langs) ??
				findDefaultFormLanguage(langs) ??
				findBrowserFormLanguage(langs) ??
				langs[0]!;
			setLanguage(formLanguage);
		},
		{ immediate: true }
	);

	onUnmounted(() => {
		latestRequestedLocale.locale = FALLBACK;
		document.documentElement.lang = FALLBACK;
	});

	const t: Translate = (id, values) => currentIntl.value.formatMessage({ id }, values) as string;

	return { setLanguage, t };
};
