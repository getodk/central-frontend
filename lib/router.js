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
import { keys } from './store/modules/request';



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
  - cacheData (optional). By default, whenever the route changes, data is
    cleared for all request keys. cacheData specifies exceptions to that rule.
    Here is an example value:

    {
      // Do not clear data for the 'project' key if the user is navigating from
      // the route named 'ProjectList' and if the routes' params match on
      // 'projectId'.
      project: {
        ProjectList: ['projectId']
      },

      // Do not clear data for any key if the user is navigating from a route
      // named 'ProjectUserList' or FieldKeyList' and if the routes' params
      // match on ['projectId'].
      '*': {
        ProjectUserList: ['projectId']
        FieldKeyList: ['projectId']
      }
    }

    Do not set this field directly: use cacheDataForKey() instead.
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
    props: true,
    children: [
      {
        path: '',
        component: ProjectShow,
        props: true,
        children: [
          { path: '', component: ProjectOverview, props: true },
          { path: 'app-users', component: FieldKeyList, props: true }
        ]
      },
      {
        path: 'forms/:xmlFormId',
        component: FormShow,
        props: true,
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
    cacheData: {},
    ...route.meta
  };
}



////////////////////////////////////////////////////////////////////////////////
// CACHE DATA

const routesByName = {};
for (const route of namedRoutes)
  routesByName[route.name] = route;

/*
cacheDataForKey() sets the cacheData meta field so that when the route changes
from `from` to `to`, and the routes' params match on `params`, the data for
`key` is not cleared.

  - key. A request key or '*'.
  - to. An array of components.
  - from (default: `to`). An array of components.
  - params. An array of param names.
*/
const cacheDataForKey = ({ key, to, params, from = to }) => {
  for (const toComponent of to) {
    const { cacheData } = routesByName[toComponent.name].meta;
    if (cacheData[key] == null) cacheData[key] = {};
    const paramsByFrom = cacheData[key];
    for (const fromComponent of from)
      paramsByFrom[fromComponent.name] = params;
  }
};

/*
dataIsCached() returns `true` if the data for `key` should not be cleared when
the route changes from `from` to `to`. Otherwise it returns `false`.

  - key. A request key or '*'.
  - to. A Route object.
  - from. A Route object.
*/
const dataIsCached = ({ key, to, from }) => {
  const { cacheData } = to.matched[to.matched.length - 1].meta;
  if (cacheData[key] == null) return false;
  const fromName = from.matched[from.matched.length - 1].name;
  const params = cacheData[key][fromName];
  if (params == null) return false;
  for (const param of params) {
    if (to.params[param] !== from.params[param]) return false;
  }
  return true;
};

// Data that does not change with navigation.
for (const key of ['session', 'currentUser']) {
  cacheDataForKey({
    key,
    to: namedRoutes.map(route => route.component),
    params: []
  });
}

// Tabs
cacheDataForKey({
  key: '*',
  to: [ProjectOverview, FieldKeyList],
  params: ['projectId']
});
cacheDataForKey({
  key: '*',
  to: [FormOverview, FormAttachmentList, FormSubmissionList, FormSettings],
  params: ['projectId', 'xmlFormId']
});

cacheDataForKey({
  key: 'project',
  to: [
    // ProjectShow
    ProjectOverview, FieldKeyList,
    // FormShow
    FormOverview, FormAttachmentList, FormSubmissionList, FormSettings
  ],
  params: ['projectId']
});



////////////////////////////////////////////////////////////////////////////////
// INITIALIZE

const router = new VueRouter({ routes });



////////////////////////////////////////////////////////////////////////////////
// LOGIN

// Navigate based on whether the user is logged in and whether the route being
// navigated to requires login or requires anonymity.
const nextByLoginStatus = (to, next) => {
  const { anonymous } = to.matched[to.matched.length - 1].meta;
  if (anonymous) {
    if (store.getters.loggedIn) {
      next('/');
    } else {
      next();
    }
  } else {
    if (store.getters.loggedIn) { // eslint-disable-line no-lonely-if
      next();
    } else {
      const query = { ...to.query, next: to.path };
      next({ path: '/login', query });
    }
  }
};

router.beforeEach((to, from, next) => {
  const isFirstNavigation = !store.state.router.navigations.first.triggered;
  if (isFirstNavigation) store.commit('triggerNavigation', 'first');
  store.commit('triggerNavigation', 'last');
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
    store.getters.loggedOut) {
    Vue.prototype.$http.get('/sessions/restore')
      .then(({ data }) => store.dispatch('get', [{
        key: 'currentUser',
        url: '/users/current',
        headers: { Authorization: `Bearer ${data.token}` },
        success: () => {
          store.commit('setData', { key: 'session', value: data });
        }
      }]))
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

// Set router state.
router.afterEach(to => {
  store.commit('setCurrentRoute', to);
  if (!store.state.router.navigations.first.confirmed)
    store.commit('confirmNavigation', 'first');
  store.commit('confirmNavigation', 'last');
});

router.afterEach(() => {
  if (store.state.alert.state) store.commit('hideAlert');
});

// Clear data.
router.afterEach((to, from) => {
  // First navigation
  if (from.matched.length === 0) return;
  if (dataIsCached({ key: '*', to, from })) return;
  for (const key of keys) {
    if (!dataIsCached({ key, to, from })) {
      if (store.state.request.data[key] != null) store.commit('clearData', key);
      if (store.state.request.requests[key].last.state === 'loading')
        store.commit('cancelRequest', key);
    }
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default router;
