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
import { createI18n } from 'vue-i18n';

// Bundle en messages, since en is the fallback locale. Other locales are loaded
// asynchronously.
import fallbackMessages from './locales/en.json5';

export const locales = new Map()
  .set('en', 'English')
  .set('cs', 'Čeština')
  .set('de', 'Deutsch')
  .set('es', 'Español')
  .set('fr', 'Français')
  .set('id', 'Bahasa Indonesia')
  .set('it', 'Italiano')
  .set('ja', '日本語')
  .set('sw', 'Kiswahili');

const fallbackLocale = 'en';



////////////////////////////////////////////////////////////////////////////////
// PLURALIZATION RULES

const noPlural = () => 0;

/*
The functions below assume that `count` is a non-negative integer.

Transifex and Intl.PluralRules differ on the number of plural categories in
French: Transifex has two, but Intl.PluralRules lists three. The default Vue
I18n pluralization rules match the French translations on Transifex, so we don't
specify pluralization rules for French here.
*/
const pluralizationRules = {
  // Czech has four plural forms on Transifex: one, few, many, and other.
  // However, we never use the "other" form. On Transifex, trendspotter wrote
  // that "other" implies an undetermined/unspecified number. (I think this
  // refers to quantifying adjectives, for example, "several users.") Note that
  // this differs from Intl.PluralRules, which only returns "many" for
  // non-integers.
  cs: (count) => {
    if (count === 1) return 0;
    if (count >= 2 && count <= 4) return 1;
    /*
    I have encountered conflicting information about which plural form to use
    for zero. On Transifex, trendspotter wrote that it is best to restructure
    the sentence, for example, "There are no users" rather than
    "There are 0 users". I think that is often the case in English as well, and
    we have a number of messages specifically for the zero case. We could
    consider increasing the number of such messages. Until then, an old MDN
    article indicates that the "many" form is used for zero:
    https://developer.mozilla.org/en-US/docs/Mozilla/Localization/Localization_and_Plurals
    */
    return 2;
  },
  // es, fr, and it have three plural forms in Transifex: one, many, and other.
  // However, we never use "many".
  es: (count) => (count === 1 ? 0 : 2),
  id: noPlural,
  ja: noPlural
};
pluralizationRules.fr = pluralizationRules.es;
pluralizationRules.it = pluralizationRules.es;



////////////////////////////////////////////////////////////////////////////////
// NUMBER FORMATS

const numberFormats = {
  default: {},
  noGrouping: { useGrouping: false },
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

export default () => createI18n({
  allowComposition: true,
  locale: fallbackLocale,
  fallbackLocale,
  messages: { [fallbackLocale]: fallbackMessages },
  pluralizationRules,
  numberFormats: numberFormatsByLocale,
  // No message in the fallback locale should use HTML, because we use component
  // interpolation instead. We also use a Transifex translation check to check
  // that no translation contains HTML.
  warnHtmlInMessage: 'error',
  silentFallbackWarn: true,
  // Silence the following warning:
  // Fall back to interpolate the keypath '[path]' with root locale.
  silentTranslationWarn: /\.full$/
});
