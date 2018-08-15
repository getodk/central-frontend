import Vue from 'vue';

import App from '../lib/components/app.vue';
import routerFactory from '../lib/router';
import testData from './data';
import { fillForm, trigger } from './util';
import { logIn } from '../lib/session';
import { mockHttp } from './http';

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
      return Vue.nextTick().then(() => {
        if (app.vm.$route.path !== '/login')
          throw new Error('user was not routed to login');
        return submitLoginForm(app);
      });
    })
    .respondWithData(() => testData.sessions.createNew())
    .respondWithData(() => testData.administrators.first());
};
