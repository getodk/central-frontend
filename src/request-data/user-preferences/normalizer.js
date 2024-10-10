const VUE_PROPERTY_PREFIX = '__v_'; // Empirically established. I couldn't find documentation on it.


class PreferenceNotRegisteredError extends Error {
  constructor(prop, whatclass, ...params) {
    super(...params);
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
    const normalizer = Object.prototype.hasOwnProperty.call(this, prop) ? this[prop] : undefined;
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
