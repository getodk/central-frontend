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
import ProjectUserList from './components/project/user/list.vue';
import SystemHome from './components/system/home.vue';
import UserHome from './components/user/home.vue';
import UserList from './components/user/list.vue';
import store from './store';
import { keys } from './store/modules/request';



////////////////////////////////////////////////////////////////////////////////
// ROUTES

/*
The following meta fields are supported for bottom-level routes:

  - restoreSession (default: true). The router looks to restoreSession right
    after the user has navigated to Frontend, when the router is navigating to
    the first route. If restoreSession is `true` for the first route, the router
    will attempt to restore the user's session before navigating to the route.
    Note that even if restoreSession is `false`, the router will not delete any
    cookie that is set. That means that if the user navigates to a route for
    which `restoreSession` is `false`, then opens a new tab and navigates to a
    route for which `restoreSession` is `true`, the user's session may be
    restored in the second tab.
  - requireLogin (default: true). Indicates whether the user must be logged in
    in order to navigate to the route. If an anonymous user (a user who is
    logged out) navigates to the route, they will be redirected to login.
  - requireAnonymity (default: false)

    Indicates whether the user must be anonymous (logged out) in order to
    navigate to the route. If a user is logged in and navigates to the route,
    they will be redirected to the root page.

    In almost all cases, a route either requires login or requires anonymity.
    However, NotFound requires neither: a user can navigate to NotFound whether
    they are logged in or anonymous.

  - requireGrants (optional). Specifies the verbs for the sitewide grants that
    the user must have in order to navigate to the route. `requireGrants` should
    only be specified for a route for which `requireLogin` is `true`.
  - preserveData (optional)

    By default, whenever the route changes, data is cleared for all request
    keys. preserveData specifies exceptions to that rule. Here is an example
    value:

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

    Do not set preserveData directly: use preserveDataForKey() instead.
*/
const routes = [
  {
    path: '/login',
    component: AccountLogin,
    meta: { requireLogin: false, requireAnonymity: true }
  },
  {
    path: '/reset-password',
    component: AccountResetPassword,
    meta: { requireLogin: false, requireAnonymity: true }
  },
  {
    path: '/account/claim',
    component: AccountClaim,
    meta: { restoreSession: false, requireLogin: false, requireAnonymity: true }
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
          { path: 'users', component: ProjectUserList, props: true },
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
      {
        path: '',
        component: UserList,
        meta: { requireGrants: ['user.list', 'assignment.list'] }
      }
    ]
  },

  {
    path: '/system',
    component: SystemHome,
    children: [
      {
        path: 'backups',
        component: BackupList,
        meta: { requireGrants: ['config.read'] }
      }
    ]
  },

  {
    path: '*',
    component: NotFound,
    meta: {
      requireLogin: false,
      // Our testing assunmes that navigating to NotFound will never send a
      // request, even to restore the user's session.
      restoreSession: false
    }
  }
];



////////////////////////////////////////////////////////////////////////////////
// ROUTE NAMES

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

const routesByName = {};
for (const route of namedRoutes)
  routesByName[route.name] = route;



////////////////////////////////////////////////////////////////////////////////
// META FIELD DEFAULTS

// Set the `meta` property of every named route.
for (const route of namedRoutes) {
  route.meta = {
    restoreSession: true,
    requireLogin: true,
    requireAnonymity: false,
    requireGrants: [],
    preserveData: {},
    ...route.meta
  };
}



////////////////////////////////////////////////////////////////////////////////
// PRESERVE DATA

/*
preserveDataForKey() sets the preserveData meta field so that when the route
changes from `from` to `to`, and the routes' params match on `params`, the data
for `key` is not cleared.

  - key. A request key or '*'.
  - to. An array of components.
  - from (default: `to`). An array of components.
  - params. An array of param names.
*/
const preserveDataForKey = ({ key, to, params, from = to }) => {
  for (const toComponent of to) {
    const { preserveData } = routesByName[toComponent.name].meta;
    if (preserveData[key] == null) preserveData[key] = {};
    const paramsByFrom = preserveData[key];
    for (const fromComponent of from)
      paramsByFrom[fromComponent.name] = params;
  }
};

/*
preservesData() returns `true` if the data for `key` should not be cleared when
the route changes from `from` to `to`. Otherwise it returns `false`.

  - key. A request key or '*'.
  - to. A Route object.
  - from. A Route object.
*/
const preservesData = (key, to, from) => {
  const { preserveData } = to.matched[to.matched.length - 1].meta;
  if (preserveData[key] == null) return false;
  const fromName = from.matched[from.matched.length - 1].name;
  const params = preserveData[key][fromName];
  if (params == null) return false;
  for (const param of params) {
    if (to.params[param] !== from.params[param]) return false;
  }
  return true;
};

// Data that does not change with navigation.
for (const key of ['session', 'currentUser']) {
  preserveDataForKey({
    key,
    to: namedRoutes.map(route => route.component),
    params: []
  });
}

// Tabs
preserveDataForKey({
  key: '*',
  to: [ProjectOverview, ProjectUserList, FieldKeyList],
  params: ['projectId']
});
preserveDataForKey({
  key: '*',
  to: [FormOverview, FormAttachmentList, FormSubmissionList, FormSettings],
  params: ['projectId', 'xmlFormId']
});

preserveDataForKey({
  key: 'project',
  to: [
    // ProjectShow
    ProjectOverview, ProjectUserList, FieldKeyList,
    // FormShow
    FormOverview, FormAttachmentList, FormSubmissionList, FormSettings
  ],
  params: ['projectId']
});



////////////////////////////////////////////////////////////////////////////////
// INITIALIZE

const router = new VueRouter({ routes });
export default router;



////////////////////////////////////////////////////////////////////////////////
// PERMISSIONS: LOGIN AND GRANTS

// nextByLoginStatus() implements the requireLogin and requireAnonymity meta
// fields. It navigates based on whether the user is logged in and whether the
// route being navigated to requires login, requires anonymity, or requires
// neither.
const nextByLoginStatus = (to, next) => {
  const { meta } = to.matched[to.matched.length - 1];
  if (meta.requireLogin) {
    if (store.getters.loggedIn) {
      next();
    } else {
      const query = { ...to.query, next: to.path };
      next({ path: '/login', query });
    }
  } else if (meta.requireAnonymity) { // eslint-disable-line no-lonely-if
    if (store.getters.loggedIn) {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
};

// Implements the restoreSession meta field.
router.beforeEach((to, from, next) => {
  const isFirstNavigation = !store.state.router.navigations.first.triggered;
  if (isFirstNavigation) store.commit('triggerNavigation', 'first');
  store.commit('triggerNavigation', 'last');
  const { restoreSession } = to.matched[to.matched.length - 1].meta;
  // In production, the last condition is not strictly needed: if this is the
  // first navigation triggered, the user is necessarily logged out. However,
  // the condition is useful for testing, where the user might be logged in
  // before the first navigation is triggered.
  if (isFirstNavigation && restoreSession && store.getters.loggedOut) {
    Vue.prototype.$http.get('/v1/sessions/restore')
      .then(({ data }) => store.dispatch('get', [{
        key: 'currentUser',
        url: '/users/current',
        headers: { Authorization: `Bearer ${data.token}` },
        extended: true,
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

// Implements the requireGrants meta field.
router.beforeEach((to, from, next) => {
  const { meta } = to.matched[to.matched.length - 1];
  if (!meta.requireLogin) {
    next();
    return;
  }
  const { currentUser } = store.state.request.data;
  for (const verb of meta.requireGrants) {
    if (!currentUser.can(verb)) {
      next('/');
      return;
    }
  }
  next();
});

export const canRoute = (routeName) => {
  const route = routesByName[routeName];
  if (route == null) throw new Error('invalid route name');
  const { currentUser } = store.state.request.data;
  for (const verb of route.meta.requireGrants) {
    if (!currentUser.can(verb)) return false;
  }
  return true;
};



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
  if (preservesData('*', to, from)) return;
  for (const key of keys) {
    if (!preservesData(key, to, from)) {
      if (store.state.request.data[key] != null) store.commit('clearData', key);
      if (store.state.request.requests[key].last.state === 'loading')
        store.commit('cancelRequest', key);
    }
  }
});
