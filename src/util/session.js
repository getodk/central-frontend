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

Frontend relies on session cookie for the authentication for all types of
requests. When the user logs out, the cookie is removed.

Across tabs, Frontend allows only one user to be logged in at a time. (Otherwise
one user would use another user's cookie.) Further, Frontend allows only one
session to be in use at a time. We use local storage to enforce this,
coordinating login and logout across tabs:

  - If the user has the login page open in two tabs, logs in in one tab, then
    tries to log in in the other, user will see message that they are already
    logged in. When the user logs in, Frontend stores the session expiration
    date in local storage, then checks it before another login attempt.
  - If the user logs out in one tab, Frontend removes the session expiration
    date from local storage, triggering other tabs to log out.

We considered allowing a user to create multiple sessions. However, this would
make logout difficult. For example, if the user logs in in one tab, creating one
session, then logs in in a second tab, creating another, it will be the second
tab that is associated with the cookie. Further, Backend will only allow the
second tab to remove the cookie. But that becomes a problem if the user closes
the second tab, then logs out in the first tab.

In summary, there is a single session, it has an associated cookie, and its
expiration date is also stored in local storage. This approach is designed to:

  - Support cookie auth
  - Ensure the user knows when they are logged out; prevent the user from seeing
    40x messages after their session has been deleted
  - Prevent one user from using another user's cookie
  - Ensure that the cookie is removed when the user logs out

If the user clears the cookie, all requests will result in failure.
If the user clears local storage, it will trigger Frontend to log out in Chrome.
However, it will not in Firefox or Safari. Yet Frontend will still be able to
coordinate logout across tabs, enforcing a single session.

Similarly, if cookies are blocked, then Frontend will not work. If local
storage is blocked, the user will be able to create multiple sessions, and
logout will not be coordinated across tabs. In Chrome, Firefox, and Safari,
blocking cookies and blocking local storage seem to go hand-in-hand.
*/

import { START_LOCATION } from 'vue-router';
import { computed, inject, onBeforeUnmount, provide } from 'vue';

import { afterNextNavigation, forceReplace } from './router';
import { apiPaths, isProblem, requestAlertMessage } from './request';
import { localStore } from './storage';
import { noop } from './util';

const removeSessionFromStorage = () => {
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
};

const requestLogout = ({ i18n, alert, http }) => http.delete(apiPaths.currentSession())
  .catch(error => {
    // logOutBeforeSessionExpires() and logOutAfterStorageChange() may try to
    // log out a session that has already been logged out. That will result in
    // a 401.2 or a 403.1 or a 404.1, which we ignore.
    const { response } = error;
    if (response != null && isProblem(response.data) &&
      (response.data.code === 401.2 || response.data.code === 403.1 || response.data.code === 404.1)) {
      return;
    }

    alert.danger(i18n.t('util.session.alert.logoutError', {
      message: requestAlertMessage(i18n, error)
    }));
    throw error;
  });

// Resets requestData, clearing data and canceling requests. Some general/system
// resources are not reset.
const resetRequestData = (requestData) => {
  const preserve = new Set([requestData.config, requestData.centralVersion]);
  for (const resource of requestData.resources) {
    if (!preserve.has(resource)) resource.reset();
  }
};

export const logOut = (container, setNext) => {
  removeSessionFromStorage();

  const promises = [];
  const { router, requestData } = container;
  const { session } = requestData;
  // If the session has expired (for example, while the computer was asleep), we
  // do not send a request, which would result in an error. (Using Date.parse()
  // rather than DateTime.fromISO() in order to reduce the bundle.)
  if (Date.parse(session.expiresAt) > Date.now())
    promises.push(requestLogout(container));

  // We do not navigate to /login for a logout during login or during the
  // initial navigation.
  if (router.currentRoute.value === START_LOCATION ||
    router.currentRoute.value.path === '/login') {
    resetRequestData(requestData);
  } else {
    // We clear most data after navigating to /login. However, we need to clear
    // the session now in order to be able to navigate to /login.
    session.data = null;
    // We are about to navigate to /login. That alone would clear most data and
    // cancel most requests. However, we also need to account for data that does
    // not change with navigation.
    afterNextNavigation(router, () => { resetRequestData(requestData); });
    // This navigation will be asynchronous (as all navigation is), but it
    // shouldn't be possible for it to be canceled. It is also not possible for
    // there to be a second logout during the navigation, in part because the
    // session has been cleared.
    promises.push(forceReplace(container, {
      path: '/login',
      query: setNext ? { next: router.currentRoute.value.fullPath } : {}
    }));
  }

  return Promise.all(promises);
};

// We check for upcoming session expiration on an interval. We take that
// approach rather than using setTimeout() to schedule logout, because
// setTimeout() does not seem to clock time while the computer is asleep.
const logOutBeforeSessionExpires = (container) => {
  const { i18n, requestData, alert } = container;
  const { session } = requestData;
  let alerted;
  return () => {
    if (!session.dataExists) return;
    const millisUntilExpires = Date.parse(session.expiresAt) - Date.now();
    const millisUntilLogout = millisUntilExpires - 60000;
    if (millisUntilLogout <= 0) {
      logOut(container, true)
        .then(() => { alert.info(i18n.t('util.session.alert.expired')); })
        .catch(noop);
    } else if (alerted !== session.expiresAt) {
      // The alert also mentions this number. The alert will be a little
      // misleading if millisUntilAlert is markedly less than zero, but that
      // case is unlikely.
      const millisUntilAlert = millisUntilLogout - 120000;
      if (millisUntilAlert <= 0) {
        alert.info(i18n.t('util.session.alert.expiresSoon'));
        alerted = session.expiresAt;
      }
    }
  };
};

const logOutAfterStorageChange = (container) => (event) => {
  // event.key == null if the user clears local storage in Chrome.
  if ((event.key == null || event.key === 'sessionExpires') &&
    container.requestData.session.dataExists) {
    logOut(container, true).catch(noop);
  }
};

export const useSessions = () => {
  const container = inject('container');
  const intervalId = setInterval(logOutBeforeSessionExpires(container), 15000);
  const storageHandler = logOutAfterStorageChange(container);
  window.addEventListener('storage', storageHandler);
  onBeforeUnmount(() => {
    clearInterval(intervalId);
    window.removeEventListener('storage', storageHandler);
  });

  /* visiblyLoggedIn.value is `true` if the user not only has all the data from
  login, but is also visibly logged in. An example of when the user has data,
  but isn't visibly logged in is if the user has submitted the login form and is
  being redirected to outside Frontend (which isn't instant). In that case, they
  will remain on /login until the redirect is complete, and the navbar will not
  change to reflect their login. */
  const { router, requestData } = container;
  const { currentUser } = requestData;
  const visiblyLoggedIn = computed(() => currentUser.dataExists &&
    router.currentRoute.value !== START_LOCATION &&
    router.currentRoute.value.path !== '/login');
  provide('visiblyLoggedIn', visiblyLoggedIn);

  return { visiblyLoggedIn };
};

export const restoreSession = (session) =>
  // There is a chance that the user's session will be restored almost
  // immediately before the session expires, such that the session expires
  // before logOutBeforeSessionExpires() logs out the user. However, that case
  // is unlikely, and the worst case should be that the user sees 401 messages.
  session.request({ url: '/v1/sessions/restore', alert: false })
    .catch(error => {
      // The user's session may be deleted without the user logging out, for
      // example, if a backup is restored. In that case, the request will result
      // in a 404. We remove sessionExpires from local storage so that
      // AccountLogin doesn't prevent the user from logging in.
      const { response } = error;
      if (response != null && isProblem(response.data) &&
        response.data.code === 404.1) {
        removeSessionFromStorage();
      }

      throw error;
    });

/* requestData.session must be set before logIn() is called, meaning that
logIn() will be preceded by either the request to restore the session or a
request to create a session. We do not watch for a logout during either request.
However, if there is a logout during the request to restore the session, then
the request for the current user should result in an error. If there is a logout
during a request to create a session, then the new session will be used. */
export const logIn = (container, newSession) => {
  const { requestData, config } = container;
  const { session, currentUser, analyticsConfig } = requestData;
  if (newSession) {
    /*
    If two tabs submit the login form at the same time, then both will end up
    logged out: the first tab to log in will set sessionExpires; then the second
    tab will set sessionExpires, logging out the first tab; which will remove
    sessionExpires, logging out the second tab. That will be true even in the
    (very unlikely) case that the two sessions have the same expiration date,
    because sessionExpires is removed before it is set.

    Similarly, if two tabs log in via OIDC at the same time, then both will end
    up logged out. However, that won't be the case if the two sessions have the
    same expiration date.
    */
    localStore.removeItem('sessionExpires');
    localStore.setItem('sessionExpires', Date.parse(session.expiresAt).toString());
  }

  return currentUser.request({ url: '/v1/users/current', extended: true })
    .catch(error => {
      // If there is a logout while the request for the current user is in
      // progress, then the request will be canceled. This callback will then be
      // run, in which case we simply re-throw the error.
      if (!session.dataExists) throw error;

      return logOut(container, false)
        .then(() => {
          throw error;
        });
    })
    .then(() => {
      if (config.showsAnalytics && currentUser.can('config.read')) {
        analyticsConfig.request({
          url: '/v1/config/analytics',
          fulfillProblem: ({ code }) => code === 404.1,
          alert: false
        }).catch(noop);
      }
    });
};
