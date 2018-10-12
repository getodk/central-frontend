import Vue from 'vue';

import testData from './data';
import { logIn } from '../lib/session';
import { mockRoute } from './http';
import { submitForm } from './event';

export const mockLogin = () => {
  if (testData.administrators.size !== 0)
    throw new Error('administrator already exists');
  logIn(testData.sessions.createNew(), testData.administrators.createPast(1).first());
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
