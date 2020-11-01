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
import { Settings } from 'luxon';

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
  Settings.defaultLocale = locale;
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

// $tcPath() is used when the full/main text of a component interpolation
// requires pluralization. `path` is the path to an array with a message for
// each plural form. (It looks like the next major version of Vue I18n will have
// a more elegant solution for this.)
export function $tcPath(path, choice) {
  // This is how we identify these paths in /bin/transifex/restructure.js.
  if (!path.endsWith('.full')) throw new Error('invalid path');
  // `path` is the path to an array, but this.$t(path) will actually return a
  // non-array object: see https://github.com/intlify/vue-i18n-loader/issues/30.
  const choices = Object.keys(this.$t(path)).length;
  const index = i18n.getChoiceIndex(choice, choices);
  // Using [] seems to work even though this.$t(path) returns a non-array
  // object.
  const choicePath = `${path}[${index}]`;
  // Note that this.$te() does not fall back to root.
  if (this.$te(choicePath)) return choicePath;
  if (choices !== 2) throw new Error('invalid number of choices');
  const fallbackIndex = choice === 1 ? 0 : 1;
  return `${path}[${fallbackIndex}]`;
}
