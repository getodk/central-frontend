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

import App from '../lib/components/app.vue';
import mockHttp from './http';
import routerFactory from '../lib/router';
import testData from './data';
import { fillForm, trigger } from './util';
import { logIn, logOut } from '../lib/session';

export { logOut };

export const mockLogin = () => {
  if (testData.administrators.size !== 0)
    throw new Error('administrator already exists');
  logIn(testData.sessions.createNew(), testData.administrators.createPast(1).first());
};

export const submitLoginForm = (wrapper) => {
  const { email } = testData.administrators.firstOrCreatePast();
  const promise = fillForm(wrapper, [
    ['#account-login input[type="email"]', email],
    ['#account-login input[type="password"]', 'password']
  ]);
  return promise
    .then(() => trigger('submit', wrapper.first('#account-login form')))
    .then(() => wrapper);
};

export const mockRouteThroughLogin = (location, mountOptions = {}) => {
  if (Vue.prototype.$session.loggedIn())
    throw new Error('session cannot be logged in');
  const fullMountOptions = Object.assign({}, mountOptions);
  fullMountOptions.router = routerFactory();
  return mockHttp()
    .mount(App, fullMountOptions)
    .request(app => {
      app.vm.$router.push(location);
      Vue.nextTick().then(() => {
        if (app.vm.$route.path !== 'login')
          throw new Error('user was not routed to login');
        submitLoginForm(app);
      });
    })
    .respondWithData(() => testData.sessions.createNew())
    .respondWithData(() => testData.administrators.first());
};
