import User from '../src/presenters/user';
import store from '../src/store';
import testData from './data';
import { mockRoute } from './http';
import { submitForm } from './event';

export const mockLogin = (options = undefined) => {
  if (testData.extendedUsers.size !== 0) throw new Error('user already exists');
  const session = testData.sessions.createNew();
  store.commit('setData', { key: 'session', value: session });
  const user = testData.extendedUsers
    .createPast(1, { role: 'admin', ...options })
    .first();
  store.commit('setData', { key: 'currentUser', value: new User(user) });
};

export const submitLoginForm = (wrapper, email) =>
  submitForm(wrapper, '#account-login form', [
    ['input[type="email"]', email],
    ['input[type="password"]', 'password']
  ]);

export const mockRouteThroughLogin =
  (location, mountOptions = {}, userOptions = {}) => {
    if (store.getters.loggedIn) throw new Error('user cannot be logged in');
    return mockRoute(location, mountOptions)
      .restoreSession(false)
      .afterResponse(app => {
        if (app.vm.$route.path !== '/login')
          throw new Error('user was not routed to login');
      })
      .request(app => {
        if (testData.extendedUsers.size !== 0)
          throw new Error('user already exists');
        const { email } = testData.extendedUsers
          .createPast(1, { role: 'admin', ...userOptions })
          .last();
        return submitLoginForm(app, email);
      })
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.first());
  };
