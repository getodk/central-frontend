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

const findAncestor = (vm, rootI18n) => {
  const i18n = vm.$i18n;
  return i18n !== rootI18n ? vm : findAncestor(vm.$parent, rootI18n);
};
const pluralIndex = (i18n, pluralPath, plural) => (i18n.te(pluralPath)
  ? i18n.getChoiceIndex(plural, Object.keys(i18n.t(pluralPath)).length)
  : (plural === 1 ? 0 : 1)); // Fall back to en.

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
    const rootI18n = injections.container.i18n;
    const ancestor = findAncestor(parent, rootI18n);
    const { tag, keypath, plural } = props;
    const { fallbackLocale } = rootI18n;
    const messageExistsInAncestor = ancestor.$i18n.te(keypath, fallbackLocale);
    if (!(messageExistsInAncestor || rootI18n.te(keypath, fallbackLocale))) {
      const ancestorName = ancestor.$options.name;
      throw new Error(`message not found for keypath ${keypath} (ancestor: ${ancestorName}`);
    }
    const i18n = messageExistsInAncestor ? ancestor.$i18n : rootI18n;

    const pluralPath = plural != null
      ? `_plural_${keypath.replaceAll('.', '__')}`
      : null;
    if (plural != null && !i18n.te(pluralPath, fallbackLocale)) {
      for (const locale of i18n.availableLocales) {
        if (i18n.te(keypath, locale)) {
          // Calling mergeLocaleMessage() seems to cause a re-render. We check
          // for the existence of pluralPath above in order to avoid an infinite
          // loop.
          i18n.mergeLocaleMessage(locale, {
            [pluralPath]: i18n.t(keypath, locale).split(' | ')
          });
        }
      }
    }

    const children = i18n.i(
      plural == null
        ? keypath
        : `${pluralPath}[${pluralIndex(i18n, pluralPath, plural)}]`,
      i18n.locale,
      slots()
    );
    return tag !== false ? h(tag, data, children) : children;
  }
};
