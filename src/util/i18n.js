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

const setLocale = (locale) => {
  i18n.locale = locale;
  document.querySelector('html').setAttribute('lang', locale);
};

// Loads a locale asynchronously.
export const loadLocale = (locale) => {
  if (!locales.has(locale)) return Promise.reject(new Error('unknown locale'));

  if (i18n.messages[locale] != null) {
    if (locale !== i18n.locale) setLocale(locale);
    return Promise.resolve();
  }

  return import(
    /* webpackChunkName: "i18n-[request]" */
    `../locales/${locale}.json`
  )
    .then(m => {
      i18n.setLocaleMessage(locale, m.default);
      setLocale(locale);
    })
    .catch(error => {
      Vue.prototype.$logger.log(error);
      throw error;
    });
};



////////////////////////////////////////////////////////////////////////////////
// PLURALIZATION

// Combination of $tc() and $n()
export function $tcn(path, count, values = undefined) {
  return this.$tc(path, count, { count: this.$n(count, 'default'), ...values });
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
