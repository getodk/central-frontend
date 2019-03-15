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
import AccountEdit from './components/account/edit.vue';
import AccountLogin from './components/account/login.vue';
import AccountResetPassword from './components/account/reset-password.vue';
import BackupList from './components/backup/list.vue';
import FieldKeyList from './components/field-key/list.vue';
import FormAttachmentList from './components/form-attachment/list.vue';
import FormOverview from './components/form/overview.vue';
import FormSettings from './components/form/settings.vue';
import FormShow from './components/form/show.vue';
import FormSubmissionList from './components/form/submission/list.vue';
import NotFound from './components/not-found.vue';
import ProjectHome from './components/project/home.vue';
import ProjectList from './components/project/list.vue';
import ProjectOverview from './components/project/overview.vue';
import ProjectShow from './components/project/show.vue';
import SystemHome from './components/system/home.vue';
import UserHome from './components/user/home.vue';
import UserList from './components/user/list.vue';
import store from './store';
import { logIn } from './session';



////////////////////////////////////////////////////////////////////////////////
// ROUTES

/*
The following meta fields are supported:

  - anonymous (default: false). A route either requires the user to be anoymous
    or requires the user not to be anonymous; `anonymous` indicates which one it
    is. If an anonymous user navigates to a route that requires login, the user
    will be redirected to login. If a user is logged in and navigates to a route
    that requires anonymity, the user will be redirected to the root page.
  - restoreSession (default: true). If the user has just opened Frontend and is
    navigating to their first route, the router looks to the restoreSession
    field of the route to determine whether to attempt to restore the user's
    session before navigating to the route. Note that even if restoreSession is
    `false`, the router will not clear any cookie that is set: if the user has a
    valid cookie and opens a new tab to a different route, their session may
    still be restored in that tab.
*/
const routes = [
  {
    path: '/login',
    component: AccountLogin,
    meta: { anonymous: true }
  },
  {
    path: '/reset-password',
    component: AccountResetPassword,
    meta: { anonymous: true }
  },
  {
    path: '/account/claim',
    component: AccountClaim,
    meta: { anonymous: true, restoreSession: false }
  },
  { path: '/account/edit', component: AccountEdit },

  { path: '/', component: ProjectList },
  {
    path: '/projects/:projectId([1-9]\\d*)',
    component: ProjectHome,
    children: [
      {
        path: '',
        component: ProjectShow,
        children: [
          { path: '', component: ProjectOverview },
          { path: 'app-users', component: FieldKeyList }
        ]
      },
      {
        path: 'forms/:xmlFormId',
        component: FormShow,
        children: [
          { path: '', component: FormOverview },
          { path: 'media-files', component: FormAttachmentList },
          { path: 'submissions', component: FormSubmissionList },
          { path: 'settings', component: FormSettings }
        ]
      }
    ]
  },

  {
    path: '/users',
    component: UserHome,
    children: [
      { path: '', component: UserList }
    ]
  },

  {
    path: '/system',
    component: SystemHome,
    children: [
      { path: 'backups', component: BackupList }
    ]
  },

  { path: '*', component: NotFound }
];

// Add a name to every bottom-level route.
const namedRoutes = [];
const stack = [...routes];
while (stack.length !== 0) {
  const route = stack.pop();
  if (route.children == null) {
    if (route.name == null) route.name = route.component.name;
    namedRoutes.push(route);
  }
  if (route.children != null) {
    if (route.name != null)
      throw new Error('a route with children cannot be named');
    for (const child of route.children)
      stack.push(child);
  }
}

// Set the `meta` property of every named route.
for (const route of namedRoutes) {
  route.meta = {
    anonymous: false,
    restoreSession: true,
    ...route.meta
  };
}



////////////////////////////////////////////////////////////////////////////////
// INITIALIZE

const router = new VueRouter({
  routes,
  scrollBehavior: (to) => {
    // Allow the user to specify the id of an HTML element to scroll to.
    if (!/^#[\w-]+$/.test(to.hash)) return null;
    const component = to.matched[to.matched.length - 1].components.default;
    if (component == null) return null;
    const prefix = component.name.replace(/[A-Z]/g, (match, offset) => {
      const hyphen = offset !== 0 ? '-' : '';
      return `${hyphen}${match.toLowerCase()}`;
    });
    return { selector: `#${prefix}-${to.hash.replace('#', '')}` };
  }
});
const state = {
  navigations: {
    first: {
      triggered: false,
      /* Suppose that during a navigation, a navigation guard uses
      `next(location)` to redirect the user to a different location, and that
      redirect navigation is confirmed. According to the standard Vue router
      terminology, the first navigation is considered aborted, not confirmed,
      even though it ultimately resulted in a confirmed navigation. For the
      `confirmed` property, we mean "confirmed" in a looser sense: if a
      navigation ultimately resulted in a confirmed navigation, the `confirmed`
      property is true even if a a navigation was aborted along the way. */
      confirmed: false
    },
    last: {
      triggered: false,
      // `false` could mean that no navigation has ever been triggered, that the
      // latest navigation is in progress, or that latest navigation was
      // ultimately aborted.
      confirmed: false
    }
  }
};



////////////////////////////////////////////////////////////////////////////////
// LOGIN

// Navigate based on whether the user is logged in and whether the route being
// navigated to requires login or requires anonymity.
const nextByLoginStatus = (to, next) => {
  const { anonymous } = to.matched[to.matched.length - 1].meta;
  if (anonymous) {
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
  const toRecord = to.matched[to.matched.length - 1];
  // Our testing assumes that navigating to NotFound will never send a request,
  // even to restore the user's session.
  if (toRecord.name === 'NotFound') {
    next();
  // In production, the last condition is not strictly needed: if this is the
  // first navigation triggered, the user is necessarily logged out. However,
  // the condition is useful for testing, where the user might be logged in
  // before the first navigation is triggered.
  } else if (isFirstNavigation && toRecord.meta.restoreSession &&
    Vue.prototype.$session.loggedOut()) {
    Vue.prototype.$http.get('/sessions/restore')
      .then(session => {
        const headers = { Authorization: `Bearer ${session.data.token}` };
        return Vue.prototype.$http.get('/users/current', { headers })
          .then(user => logIn(session.data, user.data));
      })
      .catch(() => {})
      .finally(() => {
        nextByLoginStatus(to, next);
      });
  } else {
    nextByLoginStatus(to, next);
  }
});



////////////////////////////////////////////////////////////////////////////////
// OTHER NAVIGATION GUARDS

router.afterEach(() => {
  state.navigations.first.confirmed = true;
  state.navigations.last.confirmed = true;
});

router.afterEach(() => {
  if (store.state.alert.state) store.commit('hideAlert');
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export { router, state as routerState };
