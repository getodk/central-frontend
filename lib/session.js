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
  constructor({ token, expiresAt }) {
    if (token == null) throw new Error('token is missing');
    if (expiresAt == null) throw new Error('expiresAt is missing');
    const millis = moment.utc(expiresAt).valueOf();
    if (millis == null) throw new Error('expiresAt is invalid');
    this._token = token.toString();
    this._expiresAt = millis;
    this._loggedInSinceLastPoll = true;
  }

  get token() { return this._token; }
  // TODO: Use expiresAt in some way.
  get expiresAt() { return this._expiresAt; }

  loggedInSinceLastPoll() {
    if (!this._loggedInSinceLastPoll) return false;
    this._loggedInSinceLastPoll = false;
    return true;
  }
}
