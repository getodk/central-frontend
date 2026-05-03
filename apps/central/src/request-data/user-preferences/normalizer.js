/*
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

const VUE_PROPERTY_PREFIX = '__v_'; // Empirically established. I couldn't find documentation on it.


class PreferenceNotRegisteredError extends Error {
  constructor(prop, whatclass) {
    super();
    this.name = 'PreferencesNotRegisteredError';
    this.message = `Property "${prop}" has not been registered in ${whatclass.name}`;
  }
}


export default class PreferenceNormalizer {
  static _normalize(target, prop, val) {
    const normalizer = this.normalizeFn(prop);
    const theVal = (target === undefined ? val : target[prop]);
    return normalizer(theVal);
  }

  static normalizeFn(prop) {
    const normalizer = Object.hasOwn(this, prop) ? this[prop] : undefined;
    if (normalizer !== undefined) return normalizer;
    throw new PreferenceNotRegisteredError(prop, this);
  }

  static normalize(prop, val) {
    return this._normalize(undefined, prop, val);
  }

  static getProp(target, prop) {
    if (typeof (prop) === 'string' && !prop.startsWith(VUE_PROPERTY_PREFIX)) {
      return this._normalize(target, prop);
    }
    return target[prop];
  }
}
