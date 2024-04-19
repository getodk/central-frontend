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
import { watchSyncEffect } from 'vue';

import { locales } from '../i18n';
import { memoizeForContainer } from './composable';



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

const useGlobalUtils = memoizeForContainer(({ i18n }) => {
  const formats = {};
  watchSyncEffect(() => {
    const { locale } = i18n;
    if (formats[locale] != null) return;
    formats[locale] = {
      numberFormats: {},
      listFormat: new Intl.ListFormat(locale, { style: 'narrow' })
    };
  });
  const getNumberFormat = (key) => {
    const { locale } = i18n;
    const { numberFormats } = formats[locale];
    const existingFormat = numberFormats[key];
    if (existingFormat != null) return existingFormat;
    const options = i18n.getNumberFormat(locale)[key];
    const numberFormat = new Intl.NumberFormat(locale, options);
    numberFormats[key] = numberFormat;
    return numberFormat;
  };
  return {
    formatRange: (start, end, key = 'default') => (start === end
      ? i18n.n(start, key)
      : getNumberFormat(key).formatRange(start, end)),
    formatList: (list) => formats[i18n.locale].listFormat.format(list)
  };
});

const useLocalUtils = () => {
  const { t, n } = useI18n();
  return { tn: tn(t, n) };
};

export const useI18nUtils = () => ({ ...useGlobalUtils(), ...useLocalUtils() });
