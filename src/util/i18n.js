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

import i18n from '../i18n';

export const locales = {
  en: 'English',
  es: 'Español'
};



////////////////////////////////////////////////////////////////////////////////
// loadLocale()

// We bundle the messages for the fallback locale.
const loaded = new Set([i18n.fallbackLocale]);

const setLocale = (locale) => {
  if (locale === i18n.locale) return;
  i18n.locale = locale;
  document.querySelector('html').setAttribute('lang', locale);
};

// Loads a locale asynchronously.
export const loadLocale = (locale) => {
  if (loaded.has(locale)) {
    setLocale(locale);
    return Promise.resolve();
  }
  if (locales[locale] == null) return Promise.reject();
  return import(/* webpackChunkName: "lang-[request]" */ `../locales/${locale}.json`)
    .then(messages => {
      i18n.setLocaleMessage(locale, messages);
      loaded.add(locale);
      setLocale(locale);
    })
    .catch(e => {
      Vue.prototype.$logger.error(e);
      throw e;
    });
};



////////////////////////////////////////////////////////////////////////////////
// PATHS

// See the contributing guide for an explanation of scoped paths.
const scopePath = (scope, path) => {
  const scoped = `${scope}.${path}`;
  return i18n.te(scoped, i18n.fallbackLocale) ? scoped : path;
};

// "S" for "scoped"
export const tS = (scope, path, values = undefined) => {
  const scoped = scopePath(scope, path);
  return values != null ? i18n.t(scoped, values) : i18n.t(scoped);
};

// tcS() is similar to i18n.tc(). Like tS(), it supports scoped paths. It also
// calls toLocaleString() on the count, passing the result to the message as
// localeN.
export const tcS = (scope, path, choice, values = undefined) => i18n.tc(
  scopePath(scope, path),
  choice,
  { localeN: choice.toLocaleString(), ...values }
);

export const teS = (scope, path) =>
  i18n.te(`${scope}.${path}`, i18n.fallbackLocale) ||
  i18n.te(path, i18n.fallbackLocale);

// TODO. Add comments.
export const tcPath = (scope, path, choice) => {
  const scoped = scopePath(scope, path);
  const index = i18n.getChoiceIndex(choice, i18n.t(scoped).length);
  return `${scoped}[${index}]`;
};
