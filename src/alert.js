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
import { shallowReactive } from 'vue';

class AlertData {
  constructor() {
    this._data = shallowReactive({
      // The alert's "contextual" type: 'success', 'info', 'warning', or
      // 'danger'.
      type: 'danger',
      message: null,
      // `true` if the alert should be visible and `false` if not.
      state: false,
      // The time at which the alert was last set
      at: new Date()
    });
  }

  get type() { return this._data.type; }
  get message() { return this._data.message; }
  get state() { return this._data.state; }
  get at() { return this._data.at; }

  _set(type, message) {
    this._data.type = type;
    this._data.message = message;
    this._data.state = true;
    this._data.at = new Date();
  }

  success(message) { this._set('success', message); }
  info(message) { this._set('info', message); }
  warning(message) { this._set('warning', message); }
  danger(message) { this._set('danger', message); }

  blank() {
    this._data.state = false;
    this._data.message = null;
  }
}

// Only a single alert is shown at a time. This function returns an object that
// manages the data for the alert. Regardless of where an alert is rendered, its
// data will be stored in this object.
export default () => new AlertData();
