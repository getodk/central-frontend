import { createI18n } from 'vue-i18n';

const fallbackLocale = 'en';
const locales = new Map<string, { name: string, sentenceSeparator: string }>();

const localStore = {
  getItem(name: string) {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
};

// Returns the user's preferred locale based on their previous selection and
// their browser settings. Returns `null` if there is no locale that matches
// their preferences.
const userLocale = (): string | null => {
  const webFormsLocale = localStore.getItem('odk-web-forms-locale');
  if (webFormsLocale != null && locales.has(webFormsLocale)) {
    return webFormsLocale;
  }

  const centralLocale = localStore.getItem('locale');
  if (centralLocale != null && locales.has(centralLocale)) {
    return centralLocale;
  }

  // Set it up so that we can match either on language or on language + script.
  // Region is ignored.
  const byTag = new Map<string, string>();
  for (const locale of locales.keys()) {
    const { language, script } = new Intl.Locale(locale);
    if (!byTag.has(language)) {
      byTag.set(language, locale);
    }
    if (script != null) {
      byTag.set(`${language}-${script}`, locale);
    }
  }

  for (const locale of navigator.languages) {
    const { language, script } = new Intl.Locale(locale);

    // Try to match on language + script.
    if (script != null) {
      const match = byTag.get(`${language}-${script}`);
      if (match != null) {
        return match;
      }
    }

    // Try to match on language alone.
    const match = byTag.get(language);
    if (match != null) {
      return match;
    }
  }

  return null;
};

const addLocale = (tag: string, name: string ) => {
  locales.set(tag, { name, sentenceSeparator: ' ' });
};

addLocale('en', 'English');
addLocale('de', 'Deutsch');
addLocale('es', 'Español');
addLocale('fr', 'Français');
addLocale('it', 'Italiano');
addLocale('pt', 'Português');
addLocale('zh', '汉语');
addLocale('zh-Hant', '漢語');

export const loadUsersLocale = () => {
  const locale = userLocale();
  if (locale) {
    i18n.global.locale = locale;
    document.documentElement.setAttribute('lang', locale);
  }
};

export const i18n = createI18n({
  locale: fallbackLocale,
  fallbackLocale,
  messages: { },
  // No message in the fallback locale should use HTML, because we use component
  // interpolation instead. We also use a Transifex translation check to check
  // that no translation contains HTML.
  warnHtmlInMessage: 'error',
  silentFallbackWarn: true,
  // Silence the following warning:
  // Fall back to interpolate the keypath '[path]' with root locale.
  silentTranslationWarn: /\.full$/
});
