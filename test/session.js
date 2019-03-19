import store from '../lib/store';
import testData from './data';
import { mockRoute } from './http';
import { submitForm } from './event';

export const mockLogin = () => {
  if (testData.administrators.size !== 0)
    throw new Error('administrator already exists');
  const session = testData.sessions.createNew();
  store.commit('setData', { key: 'session', value: session });
  const user = testData.administrators.createPast(1).first();
  store.commit('setData', { key: 'currentUser', value: user });
};

export const submitLoginForm = (wrapper) =>
  submitForm(wrapper, '#account-login form', [
    ['input[type="email"]', testData.administrators.firstOrCreatePast().email],
    ['input[type="password"]', 'password']
  ]);

export const mockRouteThroughLogin = (location, mountOptions = {}) => {
  if (store.getters.loggedIn) throw new Error('user cannot be logged in');
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
