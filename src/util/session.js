/*
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
To log in, the user submits the login form. Backend responds with a session
object, as well as an associated cookie that is Secure and HttpOnly. If the user
then opens Frontend in a new tab, Frontend will use the cookie to restore the
session.

The cookie is used in only limited ways: mostly Frontend specifies the session
token as a bearer token. The cookie is used to restore the session. It is also
used for non-AJAX requests, including download links and iframe forms. When the
user logs out, the cookie is removed.

Across tabs, Frontend allows only one user to be logged in at a time. (Otherwise
one user would use another user's cookie.) Further, Frontend allows only one
session to be in use at a time. We use local storage to enforce this,
coordinating login and logout across tabs:

  - If the user has the login page open in two tabs, logs in in one tab, then
    tries to log in the other, the second login will fail, because the cookie
    will be sent without a CSRF token and without other auth. Because the cookie
    is HttpOnly, Frontend cannot check for the cookie directly. Instead, when
    the user logs in, Frontend stores the session expiration date in local
    storage, then checks it before another login attempt.
  - If the user logs out in one tab, Frontend removes the session expiration
    date from local storage, triggering other tabs to log out.

We considered allowing a user to create multiple sessions. However, this would
make logout difficult. For example, if the user logs in in one tab, creating one
session, then logs in in a second tab, creating another, it will be the second
tab that is associated with the cookie. Further, Backend will only allow the
second tab to remove the cookie. But that becomes a problem if the user closes
the second tab, then logs out in the first tab.

In summary, there is a single session, it has an associated cookie, and its
expiration date is also stored in local storage.

If the cookie is removed, then functionality that relies on it will stop
working. Chrome allows the user to clear cookies and local storage separately.
If the user clears local storage, it will trigger Frontend to log out in Chrome.
However, it will not in Firefox or Safari. Yet Frontend will still be able to
coordinate logout across tabs, enforcing a single session.

Similarly, if cookies are blocked, then functionality that relies on the cookie
will not work. If local storage is blocked, the user will be able to create
multiple sessions, and logout will not be coordinated across tabs. In Chrome,
Firefox, and Safari, blocking cookies and blocking local storage seem to go
hand-in-hand.
*/

import Vue from 'vue';

import i18n from '../i18n';
import { apiPaths, isProblem, requestAlertMessage } from './request';
import { forceReplace } from './router';
import { localStore } from './storage';
import { noop } from './util';

const timeouts = { alert: null, logout: null };

// Exported for use in testing
export const cancelScheduledLogout = () => {
  if (timeouts.alert != null) {
    clearTimeout(timeouts.alert);
    timeouts.alert = null;
  }

  if (timeouts.logout != null) {
    clearTimeout(timeouts.logout);
    timeouts.logout = null;
  }
};

export const logOut = (router, store, setNext) => {
  /*
  If the user clears local storage, that will trigger a storage event in Chrome.
  However, it will not in Firefox or Safari. Yet even in that case, we want to
  ensure that logging out in one tab will trigger other tabs to log out. To do
  so, we set sessionExpires before removing it, ensuring a storage event (and
  actually probably two).

  Another tab may have already removed sessionExpires by logging out. In that
  case, setting and removing sessionExpires here will trigger a storage event in
  the other tab, though that should have no effect.
  */
  localStore.setItem('sessionExpires', '0');
  localStore.removeItem('sessionExpires');

  const { token } = store.state.request.data.session;
  const request = Vue.prototype.$http.delete(apiPaths.session(token), {
    headers: { Authorization: `Bearer ${token}` }
  })
    .catch(error => {
      // scheduleLogout() and App may try to log out a session that has already
      // been logged out. Backend returns a 403.1 in that case, which we ignore.
      if (error.response != null && isProblem(error.response.data) &&
        error.response.data.code === 403.1) {
        return;
      }

      store.commit('setAlert', {
        type: 'danger',
        message: i18n.t('util.session.alert.logoutError', {
          message: requestAlertMessage(error)
        })
      });
      throw error;
    });

  store.commit('clearData');

  // We do not navigate to /login for a logout during login or otherwise during
  // the initial navigation. Note that after the initial navigation, navigation
  // is synchronous, so a logout during later navigation is not possible.
  if (!store.state.router.anyNavigationConfirmed ||
    router.currentRoute.path === '/login') {
    if (store.getters.loading('currentUser'))
      store.commit('cancelRequest', 'currentUser');
  } else {
    const location = { path: '/login' };
    if (setNext) location.query = { next: router.currentRoute.fullPath };
    // This will cancel any requests.
    forceReplace(router, store, location);
  }

  cancelScheduledLogout();
  return request;
};

const scheduleLogout = (router, store, sessionExpires) => {
  const millisUntilExpires = sessionExpires - Date.now();
  const millisUntilLogout = millisUntilExpires - 60000;
  // The alert also mentions this number.
  const millisUntilAlert = millisUntilLogout - 120000;
  // We do not show the alert if millisUntilAlert < 0, because its message would
  // be incorrect.
  if (millisUntilAlert >= 0) {
    timeouts.alert = setTimeout(
      () => {
        store.commit('setAlert', {
          type: 'info',
          message: i18n.t('util.session.alert.expiresSoon')
        });
        timeouts.alert = null;
      },
      millisUntilAlert
    );
  }
  timeouts.logout = setTimeout(
    () => {
      logOut(router, store, true)
        .then(() => {
          store.commit('setAlert', {
            type: 'info',
            message: i18n.t('util.session.alert.expired')
          });
        })
        .catch(noop);
    },
    Math.max(millisUntilLogout, 0)
  );
};

/* The session must be set in the store before logIn() is called, meaning that
logIn() will be preceded by either the request to restore the session or a
request to create a session. We do not watch for a logout during either request.
However, if there is a logout during the request to restore the session, then
the request for the current user should result in an error. If there is a logout
during a request to create a session, then the new session will be used. */
export const logIn = (router, store, newSession) => {
  // Using Date.parse() rather than DateTime.fromISO() in order to reduce the
  // bundle.
  const sessionExpires = Date.parse(store.state.request.data.session.expiresAt);
  if (newSession) {
    /* If two tabs submit the login form at the same time, then both will end up
    logged out: the first tab to log in will set sessionExpires; then the second
    tab will set sessionExpires, logging out the first tab; which will remove
    sessionExpires, logging out the second tab. That will be true even in the
    (very unlikely) case that the two sessions have the same expiration date,
    because sessionExpires is removed before it is set. */
    localStore.removeItem('sessionExpires');
    localStore.setItem('sessionExpires', sessionExpires.toString());
  }

  // If the route changed during this request, it would cancel the request. It
  // is the caller's responsibility to ensure that the route does not change.
  const request = store.dispatch('get', [{
    key: 'currentUser',
    url: '/v1/users/current',
    extended: true
  }])
    .catch(error => {
      // If another tab logs out, that will trigger a logout in this tab. If the
      // request for the current user is in progress, it will be canceled, and
      // this callback will be run. In that case, we simply re-throw the error.
      if (store.state.request.data.session == null) throw error;

      return logOut(router, store, false)
        .then(() => {
          throw error;
        });
    });

  scheduleLogout(router, store, sessionExpires);
  return request;
};
