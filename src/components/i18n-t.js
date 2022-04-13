/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
export default {
  name: 'i18n-t', // eslint-disable-line vue/name-property-casing
  functional: true,
  inject: ['container'],
  props: {
    tag: {
      type: [String, Boolean],
      default: false
    },
    keypath: {
      type: String,
      required: true
    },
    plural: Number
  },
  render(h, { props, slots, data, parent, injections }) {
    const { tag, keypath, plural } = props;
    const { fallbackLocale } = parent.$i18n;
    // Note that te() does not fall back to root.
    const i18n = parent.$i18n.te(keypath, fallbackLocale)
      ? parent.$i18n
      : injections.container.i18n;
    if (plural == null) {
      const children = i18n.i(keypath, i18n.locale, slots());
      return tag !== false ? h(tag, data, children) : children;
    }

    const pluralPath = `_plural_${keypath.replaceAll('.', '__')}`;
    for (const locale of i18n.availableLocales) {
      if (i18n.te(keypath, locale) && !i18n.te(pluralPath, locale)) {
        // Calling mergeLocaleMessage() seems to cause the component to
        // re-render. We check for the existence of pluralPath above in order to
        // avoid an infinite loop.
        i18n.mergeLocaleMessage(locale, {
          [pluralPath]: i18n.t(keypath, locale).split(' | ')
        });
      }
    }
    const index = i18n.te(keypath)
      ? i18n.getChoiceIndex(plural, Object.keys(i18n.t(pluralPath)).length)
      : (plural === 1 ? 0 : 1); // Fall back to en.
    const children = i18n.i(`${pluralPath}[${index}]`, i18n.locale, slots());
    return tag !== false ? h(tag, data, children) : children;
  }
};
