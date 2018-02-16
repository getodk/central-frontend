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

import AccountLogin from './components/account/login.vue';

import FormList from './components/form/list.vue';
import FormShow from './components/form/show.vue';

import UserList from './components/user/list.vue';

import NotFound from './components/not-found.vue';



////////////////////////////////////////////////////////////////////////////////
// ROUTES

const routes = () => [
  { path: '/', redirect: '/forms' },

  { path: '/login', component: AccountLogin },

  { path: '/forms', component: FormList },
  { path: '/forms/:xmlFormId', component: FormShow },

  { path: '/users', component: UserList },

  { path: '*', component: NotFound }
];



////////////////////////////////////////////////////////////////////////////////
// LOGIN

const guardAuth = (router) => router.beforeEach((to, from, next) => {
  if (router.app.$session.loggedOut()) {
    if (to.path === '/login') {
      // If you are logged out and are navigating to login, you are going to the
      // right place.
      next();
    } else {
      // If you are logged out and are navigating somewhere other than login,
      // you need to log in first.
      const query = Object.assign({}, to.query, { next: to.path });
      next({ path: '/login', query });
    }
  } else {
    if (to.path === '/login') { // eslint-disable-line no-lonely-if
      // If you are logged in, you cannot revisit the login page.
      next('/forms');
    } else {
      // If you are logged in, you may navigate beyond the login page.
      next();
    }
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default function routerFactory() {
  const router = new VueRouter({ routes: routes() });
  guardAuth(router);
  return router;
}
