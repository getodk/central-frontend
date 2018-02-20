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
import VueRouter from 'vue-router';

import AccountClaim from './components/account/claim.vue';
import AccountLogin from './components/account/login.vue';
import AccountResetPassword from './components/account/reset-password.vue';
import FormList from './components/form/list.vue';
import FormShow from './components/form/show.vue';
import NotFound from './components/not-found.vue';
import UserList from './components/user/list.vue';



////////////////////////////////////////////////////////////////////////////////
// ROUTES

const routes = () => [
  { path: '/', redirect: '/forms' },

  { path: '/login', component: AccountLogin },
  { path: '/reset-password', component: AccountResetPassword },
  { path: '/account/claim', component: AccountClaim },

  { path: '/forms', component: FormList },
  { path: '/forms/:xmlFormId', component: FormShow },

  { path: '/users', component: UserList },

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
