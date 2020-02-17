/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

export const noop = () => {};

export const uniqueSequence = () => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
};

// Provides access to the single, global alert whose state is stored in the Vuex
// store.
export class StoreAlert {
  constructor(store) {
    this._store = store;
  }

  get _storeState() { return this._store.state.alert; }
  _commit(type, payload) { this._store.commit(type, payload); }

  get type() { return this._storeState.type; }
  get message() { return this._storeState.message; }
  get state() { return this._storeState.state; }
  get at() { return this._storeState.at; }

  success(message) { this._commit('setAlert', { type: 'success', message }); }
  info(message) { this._commit('setAlert', { type: 'info', message }); }
  warning(message) { this._commit('setAlert', { type: 'warning', message }); }
  danger(message) { this._commit('setAlert', { type: 'danger', message }); }

  blank(type = undefined) { this._commit('resetAlert', type); }
}
