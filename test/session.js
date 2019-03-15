import Vue from 'vue';

import store from '../lib/store';
import testData from './data';
import { mockRoute } from './http';
import { submitForm } from './event';

export const mockLogin = () => {
  if (testData.administrators.size !== 0)
    throw new Error('administrator already exists');
  store.commit('setSession', testData.sessions.createNew());
  const user = testData.administrators.createPast(1).first();
  store.commit('setData', { path: ['currentUser'], value: user, extended: false });
};

export const submitLoginForm = (wrapper) =>
  submitForm(wrapper, '#account-login form', [
    ['input[type="email"]', testData.administrators.firstOrCreatePast().email],
    ['input[type="password"]', 'password']
  ]);

export const mockRouteThroughLogin = (location, mountOptions = {}) => {
  if (Vue.prototype.$session.loggedIn())
    throw new Error('session cannot be logged in');
  return mockRoute(location, mountOptions)
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
