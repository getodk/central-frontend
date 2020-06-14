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
import VueI18n from 'vue-i18n';
// Bundle en messages, since en is the fallback locale. Other locales are loaded
// asynchronously.
import fallbackMessages from './locales/en.json';

export const locales = new Map()
  .set('en', 'English')
  .set('es', 'Español');

const fallbackLocale = 'en';



////////////////////////////////////////////////////////////////////////////////
// NUMBER FORMATS

const numberFormats = {
  default: {},
  percent: { style: 'percent' }
};

for (let i = 1; i < 15; i += 1)
  numberFormats[`maximumFractionDigits${i}`] = { maximumFractionDigits: i };

for (let i = 1; i < 8; i += 1) {
  numberFormats[`fractionDigits${i}`] = {
    minimumFractionDigits: i,
    maximumFractionDigits: i
  };
}

const numberFormatsByLocale = {};
for (const locale of locales.keys()) {
  // There must be a property for each locale, even though the value is the
  // same. Otherwise, $n() will use the fallback locale.
  numberFormatsByLocale[locale] = numberFormats;
}



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default new VueI18n({
  locale: fallbackLocale,
  fallbackLocale,
  messages: { [fallbackLocale]: fallbackMessages },
  numberFormats: numberFormatsByLocale,
  warnHtmlInMessage: 'error',
  silentFallbackWarn: true
});
