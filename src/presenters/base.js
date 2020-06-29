/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

let key = 0;

class Base {
  constructor(data) {
    this._data = data;
  }

  get object() {
    return this._data;
  }

  // Returns a unique ID for the object. This is particularly useful if the
  // object has no other ID property. key() is typically used with v-for and
  // v-bind:key. key() does _not_ return a Backend Key object.
  get key() {
    if (this._key != null) return this._key;
    key += 1;
    this._key = key;
    return key;
  }

  with(data) {
    return new (this.constructor)({ ...this._data, ...data });
  }
}

export default (props) => {
  const klass = class extends Base {};

  // Add a getter for each property of the underlying data.
  for (const name of props) {
    Object.defineProperty(klass.prototype, name, {
      get() { return this._data[name]; }
    });
  }

  return klass;
};
