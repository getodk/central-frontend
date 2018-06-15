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



////////////////////////////////////////////////////////////////////////////////
// ROUTES

const routes = () => [
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

  { path: '*', component: NotFound }
];



////////////////////////////////////////////////////////////////////////////////
// LOGIN

// Paths for which the user may (actually, must) be anonymous
const ANONYMOUS_PATHS = ['/login', '/reset-password', '/account/claim'];

const guardAuth = (router) => router.beforeEach((to, from, next) => {
  if (router.app.$session.loggedOut()) {
    if (ANONYMOUS_PATHS.includes(to.path))
      next();
    else {
      const query = Object.assign({}, to.query, { next: to.path });
      next({ path: '/login', query });
    }
  } else {
    if (ANONYMOUS_PATHS.includes(to.path)) // eslint-disable-line no-lonely-if
      next('/forms');
    else
      next();
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default function routerFactory() {
  const router = new VueRouter({ routes: routes() });
  guardAuth(router);
  return router;
}
