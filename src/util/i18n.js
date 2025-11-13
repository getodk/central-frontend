/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

import { localStore } from './storage';
import { locales } from '../i18n';
import { memoizeForContainer } from './composable';

// Returns the user's preferred locale based on their previous selection and
// their browser settings. Returns `null` if there is no locale that matches
// their preferences.
export const userLocale = () => {
  const storageLocale = localStore.getItem('locale');
  if (storageLocale != null && locales.has(storageLocale)) return storageLocale;

  // Set it up so that we can match either on language or on language + script.
  // Region is ignored.
  const byTag = new Map();
  for (const locale of locales.keys()) {
    const { language, script } = new Intl.Locale(locale);
    if (!byTag.has(language)) byTag.set(language, locale);
    if (script != null) byTag.set(`${language}-${script}`, locale);
  }

  for (const locale of navigator.languages) {
    const { language, script } = new Intl.Locale(locale);

    // Try to match on language + script.
    if (script != null) {
      const match = byTag.get(`${language}-${script}`);
      if (match != null) return match;
    }

    // Try to match on language alone.
    const match = byTag.get(language);
    if (match != null) return match;
  }

  return null;
};



////////////////////////////////////////////////////////////////////////////////
// loadLocale()

const setLocale = (i18n, locale) => {
  i18n.locale = locale; // eslint-disable-line no-param-reassign
  document.documentElement.setAttribute('lang', locale);
};

// Loads a locale asynchronously.
export const loadLocale = ({ i18n, logger }, locale) => {
  if (!locales.has(locale)) return Promise.reject(new Error('unknown locale'));

  if (i18n.messages[locale] != null) {
    if (locale !== i18n.locale) setLocale(i18n, locale);
    return Promise.resolve();
  }

  return import(
    /* webpackChunkName: "i18n-[request]" */
    `../locales/${locale}.json`
  )
    .then(m => {
      i18n.setLocaleMessage(locale, m.default);
      setLocale(i18n, locale);
    })
    .catch(error => {
      logger.log(error);
      throw error;
    });
};



////////////////////////////////////////////////////////////////////////////////
// tn(), $tcn()

// Combination of $tc() and $n()
export function $tcn(path, count, values = undefined) {
  return this.$tc(path, count, { count: this.$n(count, 'default'), ...values });
}

// Combination of t() and n()
const tn = (t, n) => (path, count, values) => {
  const list = { count: n(count, 'default') };
  Object.entries(values || {}).forEach(([k, v]) => { list[k] = typeof v === 'number' ? n(v, 'default') : v; });
  return t(path, list, count);
};



////////////////////////////////////////////////////////////////////////////////
// useI18nUtils()

const listFormatOptions = {
  default: { style: 'narrow' },
  long: { style: 'long' }
};

export const joinSentences = (i18n, sentences) =>
  sentences.join(locales.get(i18n.locale).sentenceSeparator);

const useGlobalUtils = memoizeForContainer(({ i18n }) => {
  const numberFormats = {};
  const getNumberFormat = (key) => {
    const { locale } = i18n;
    if (numberFormats[locale] == null) numberFormats[locale] = {};
    const existingFormat = numberFormats[locale][key];
    if (existingFormat != null) return existingFormat;
    const options = i18n.getNumberFormat(locale)[key];
    if (options == null) throw new Error('unknown key');
    const numberFormat = new Intl.NumberFormat(locale, options);
    numberFormats[locale][key] = numberFormat;
    return numberFormat;
  };

  const listFormats = {};
  const getListFormat = (key) => {
    const { locale } = i18n;
    if (listFormats[locale] == null) listFormats[locale] = {};
    const existingFormat = listFormats[locale][key];
    if (existingFormat != null) return existingFormat;
    const options = listFormatOptions[key];
    if (options == null) throw new Error('unknown key');
    const listFormat = new Intl.ListFormat(locale, options);
    listFormats[locale][key] = listFormat;
    return listFormat;
  };

  return {
    formatRange: (start, end, key = 'default') => (start === end
      ? i18n.n(start, key)
      : getNumberFormat(key).formatRange(start, end)),
    formatList: (list, key = 'default') => getListFormat(key).format(list),
    formatListToParts: (list, key = 'default') =>
      getListFormat(key).formatToParts(list),

    sentenceSeparator: computed(() =>
      locales.get(i18n.locale).sentenceSeparator),
    joinSentences: joinSentences.bind(null, i18n)
  };
});

const useLocalUtils = () => {
  const { t, n } = useI18n();
  return { tn: tn(t, n) };
};

export const useI18nUtils = () => ({ ...useGlobalUtils(), ...useLocalUtils() });
