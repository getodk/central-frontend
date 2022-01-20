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
import Vue from 'vue';

import i18n, { locales } from '../i18n';



////////////////////////////////////////////////////////////////////////////////
// FLATPICKR

// Note that when we load a flatpickr locale, flatpickr itself may or may not be
// imported yet. Thus, rather than using flatpickr immediately (for example, by
// calling flatpickr.localize()), we simply store the locale for DateRangePicker
// to use.

// flatpickrLocales does not have a property for the fallback locale, because
// DateRangePicker bundles that locale.
export const flatpickrLocales = {};

const loadFlatpickrLocale = (locale) => {
  // flatpickr bundles the flatpickr locale for en.
  if (flatpickrLocales[locale] != null || locale === 'en')
    return Promise.resolve();
  return import(
    /* webpackExclude: /(default|index)\.js$/ */
    /* webpackChunkName: "flatpickr-locale-[request]" */
    `flatpickr/dist/l10n/${locale}.js`
  )
    .then(m => {
      flatpickrLocales[locale] = m.default[locale];
    });
};



////////////////////////////////////////////////////////////////////////////////
// loadLocale()

// We bundle the messages for the fallback locale.
const loaded = new Set([i18n.fallbackLocale]);

const setLocale = (locale) => {
  i18n.locale = locale;
  document.querySelector('html').setAttribute('lang', locale);
};

const loadMessages = (locale) => {
  if (i18n.messages[locale] != null) return Promise.resolve();
  return import(
    /* webpackChunkName: "i18n-[request]" */
    `../locales/${locale}.json`
  )
    .then(m => {
      i18n.setLocaleMessage(locale, m.default);
    });
};

// Loads a locale asynchronously.
export const loadLocale = (locale) => {
  if (loaded.has(locale)) {
    if (locale !== i18n.locale) setLocale(locale);
    return Promise.resolve();
  }
  if (!locales.has(locale)) return Promise.reject();
  return Promise.all([loadMessages(locale), loadFlatpickrLocale(locale)])
    .then(() => {
      loaded.add(locale);
      setLocale(locale);
    })
    .catch(e => {
      Vue.prototype.$logger.error(e);
      throw e;
    });
};



////////////////////////////////////////////////////////////////////////////////
// PLURALIZATION

// Combination of $tc() and $n()
export function $tcn(path, choice, values = undefined) {
  const count = this.$n(choice, 'default');
  return this.$tc(path, choice, { count, ...values });
}
