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
  constructor({ token, expires }) {
    const millis = moment.utc(expires).valueOf();
    if (token == null || millis == null) throw new Error('invalid session');
    this._token = token.toString();
    this._expires = millis;
  }

  get token() { return this._token; }
  // TODO: Use `expires` in some way.
  get expires() { return this._expires; }
}
