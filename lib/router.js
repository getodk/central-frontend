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
import VueRouter from 'vue-router';

import AccountClaim from './components/account/claim.vue';
import AccountLogin from './components/account/login.vue';
import AccountResetPassword from './components/account/reset-password.vue';
import BackupList from './components/backup/list.vue';
import FieldKeyList from './components/field-key/list.vue';
import FormList from './components/form/list.vue';
import FormOverview from './components/form/overview.vue';
import FormSettings from './components/form/settings.vue';
import FormShow from './components/form/show.vue';
import FormSubmissions from './components/form/submissions.vue';
import NotFound from './components/not-found.vue';
import RootHome from './components/root/home.vue';
import SystemHome from './components/system/home.vue';
import UserHome from './components/user/home.vue';
import UserList from './components/user/list.vue';
import { logIn } from './session';



////////////////////////////////////////////////////////////////////////////////
// ROUTES

const routes = [
  { path: '/', component: RootHome },

  { path: '/login', component: AccountLogin },
  { path: '/reset-password', component: AccountResetPassword },
  { path: '/account/claim', component: AccountClaim },

  { path: '/forms', component: FormList },
  {
    path: '/forms/:xmlFormId',
    component: FormShow,
    children: [
      { path: '', component: FormOverview },
      { path: 'submissions', component: FormSubmissions },
      { path: 'settings', component: FormSettings }
    ]
  },

  {
    path: '/users',
    component: UserHome,
    children: [
      { path: '', component: UserList },
      { path: 'field-keys', component: FieldKeyList }
    ]
  },

  {
    path: '/system',
    component: SystemHome,
    children: [
      { path: 'backups', component: BackupList }
    ]
  },

  { path: '*', component: NotFound, name: 'notFound' }
];



////////////////////////////////////////////////////////////////////////////////
// INITIALIZE

const router = new VueRouter({ routes });
// This state is exported for use in tests. Do not use router state outside of
// tests.
const state = {
  navigations: {
    first: {
      triggered: false,
      confirmed: false
    },
    last: {
      triggered: false,
      // `false` could mean that no navigation has been triggered, that the
      // last navigation is in progress, or that the last navigation was
      // aborted.
      confirmed: false
    }
  }
};



////////////////////////////////////////////////////////////////////////////////
// LOGIN

/*
The following are the only paths for which the user may be anonymous. Actually,
to navigate to these paths, the user MUST be anonymous:

  1. If the user attempts to navigate to one of these paths and is already
     logged in, they will be redirected to the root page.
  2. If the user is not logged in, the router looks to the `restore` property
     for the path to determine whether to attempt to restore the user's session.
     - If the router restores the user's session, the user will be navigated to
       the root page.
     - Even if the router does not attempt to restore the user's session, it
       does not clear any cookie that is set: if the user has a valid cookie and
       opens a new tab to a different path, their session may still be restored
       in that tab.
*/
const anonymousPaths = {
  '/login': { restore: true },
  '/reset-password': { restore: true },
  '/account/claim': { restore: false }
};

// Navigate based on whether the user is logged in and whether the route being
// navigated to requires login or requires anonymity.
const nextByLoginStatus = (to, anonymousPath, next) => {
  if (anonymousPath != null) {
    if (Vue.prototype.$session.loggedIn())
      next('/');
    else
      next();
  } else {
    if (Vue.prototype.$session.loggedIn()) // eslint-disable-line no-lonely-if
      next();
    else {
      const query = { ...to.query, next: to.path };
      next({ path: '/login', query });
    }
  }
};

router.beforeEach((to, from, next) => {
  const isFirstNavigation = !state.navigations.first.triggered;
  state.navigations.first.triggered = true;
  state.navigations.last = { triggered: true, confirmed: false };
  const anonymous = anonymousPaths[to.path];
  // Our testing assumes that navigating to NotFound will never send a request.
  if (to.matched.length === 1 && to.matched[0].name === 'notFound')
    next();
  // In production, the last condition is not strictly needed: if this is the
  // first navigation triggered, the user is necessarily logged out. However,
  // the condition is useful for testing, where the user might be logged in
  // before the first navigation is triggered.
  else if (isFirstNavigation && (anonymous == null || anonymous.restore) &&
    Vue.prototype.$session.loggedOut()) {
    Vue.prototype.$http.get('/sessions/restore')
      .then(session => {
        const headers = { Authorization: `Bearer ${session.data.token}` };
        return Vue.prototype.$http.get('/users/current', { headers })
          .then(user => logIn(session.data, user.data));
      })
      .catch(() => {})
      // Using then(), not finally(), because the catch() above does not rethrow
      // the error and returns a resolved promise.
      .then(() => nextByLoginStatus(to, anonymous, next));
  } else {
    nextByLoginStatus(to, anonymous, next);
  }
});



////////////////////////////////////////////////////////////////////////////////
// NAVIGATION CONFIRMED

router.afterEach(() => {
  state.navigations.first.confirmed = true;
  state.navigations.last.confirmed = true;
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export { router, state as routerState };
