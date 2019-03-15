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
import Vue from 'vue';
import { DateTime } from 'luxon';

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

export const logRequestError = (error) => {
  if (error.response)
    Vue.prototype.$logger.log(error.response.data);
  else if (error.request)
    Vue.prototype.$logger.log(error.request);
  else
    Vue.prototype.$logger.log('Error', error.message);
};

const formatDatePart = (dateTime) => {
  const now = DateTime.local();
  if (now.hasSame(dateTime, 'day')) return 'Today';
  if (now.minus({ days: 1 }).hasSame(dateTime, 'day')) return 'Yesterday';
  for (let i = 2; i <= 5; i += 1)
    if (now.minus({ days: i }).hasSame(dateTime, 'day'))
      return dateTime.toFormat('cccc');
  return dateTime.toFormat('yyyy/MM/dd');
};
export const formatDate = (isoString, blankString = '') => {
  if (isoString == null) return blankString;
  const dateTime = DateTime.fromISO(isoString);
  if (!dateTime.isValid) throw new Error(dateTime.invalidReason);
  const datePart = formatDatePart(dateTime);
  const timePart = dateTime.toFormat('HH:mm');
  return `${datePart} ${timePart}`;
};
