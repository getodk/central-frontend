import Vue from 'vue';

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
  return mockHttp()
    .route(location, mountOptions)
    .restoreSession(false)
    .complete()
    .request(app => {
      if (app.vm.$route.path !== '/login')
        throw new Error('user was not routed to login');
      return submitLoginForm(app);
    })
    .respondWithData(() => testData.sessions.createNew())
    .respondWithData(() => testData.administrators.first());
};
