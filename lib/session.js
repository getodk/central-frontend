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

/*
A subclass of AbstractSession must:

  1. Define this._changedSinceLastPoll in its constructor.
  2. Override loggedIn().
*/
class AbstractSession {
  loggedIn() {
    throw new Error('not implemented');
  }

  loggedOut() {
    return !this.loggedIn();
  }

  changedSinceLastPoll() {
    const changed = this._changedSinceLastPoll;
    this._changedSinceLastPoll = false;
    return changed;
  }
}

class LoggedOutSession extends AbstractSession {
  loggedIn() {
    return false;
  }
}

export class NeverLoggedInSession extends LoggedOutSession {
  constructor() {
    super();
    this._changedSinceLastPoll = false;
  }
}

export class LoggedInSession extends AbstractSession {
  constructor({ token, expiresAt }) {
    super();
    this._token = token;
    this._expiresAt = moment.utc(expiresAt).valueOf();
    this._changedSinceLastPoll = true;
  }

  loggedIn() {
    return true;
  }

  get token() {
    return this._token;
  }

  // TODO: Use expiresAt in some way.
  get expiresAt() {
    return this._expiresAt;
  }
}

// A session that was logged in, but is now logged out.
export class FormerlyLoggedInSession extends LoggedOutSession {
  constructor() {
    super();
    this._changedSinceLastPoll = true;
  }
}
