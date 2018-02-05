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
import Vue from 'vue';

import { FormerlyLoggedInSession, LoggedInSession, NeverLoggedInSession } from './session';

// Sets or resets globals to their initial values.
export function resetAuth() {
  Vue.prototype.$session = new NeverLoggedInSession();
  Vue.prototype.$user = null;
  delete Vue.prototype.$http.defaults.headers.common.Authorization;
}

// Updates globals after login.
export function logIn(session, user) {
  Vue.prototype.$session = new LoggedInSession(session);
  Vue.prototype.$user = user;
  const headers = Vue.prototype.$http.defaults.headers.common;
  headers.Authorization = `Bearer ${session.token}`;
}

// Updates globals after logout.
export function logOut() {
  Vue.prototype.$session = new FormerlyLoggedInSession();
  Vue.prototype.$user = null;
  delete Vue.prototype.$http.defaults.headers.common.Authorization;
}
