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

// Provides access to the single, global alert whose state is stored in the Vuex
// store.
export class StoreAlert { // eslint-disable-line import/prefer-default-export
  constructor(store) {
    this._store = store;
  }

  get _state() { return this._store.state.alert; }
  get type() { return this._state.type; }
  get message() { return this._state.message; }
  get state() { return this._state.state; }
  get at() { return this._state.at; }

  _setAlert(type, message = undefined) {
    this._store.commit('setAlert', { type, message });
  }

  success(message) { this._setAlert('success', message); }
  info(message) { this._setAlert('info', message); }
  warning(message) { this._setAlert('warning', message); }
  danger(message) { this._setAlert('danger', message); }

  blank() { this._store.commit('resetAlert'); }
}
