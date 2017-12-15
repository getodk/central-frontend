/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import moment from 'moment';

export default class Session {
  get token() { return this._token; }
  // TODO: Use `expires` in some way.
  get expires() { return this._expires; }

  // set() sets or resets the session. If successful, it returns true. If the
  // input is invalid, it takes no action and returns false.
  set({ token, expires }) {
    const millis = moment.utc(expires).valueOf();
    if (token == null || millis == null) return false;
    this._token = token.toString();
    this._expires = millis;
    return true;
  }

  clear() {
    this._token = null;
    this._expires = null;
  }

  isLoggedIn() {
    return this._token != null;
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }
}
