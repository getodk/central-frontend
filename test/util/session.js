import { DateTime } from 'luxon';

import testData from '../data';

let loggedIn = false;

// eslint-disable-next-line import/prefer-default-export
export const mockLogin = (options = undefined) => {
  if (testData.extendedUsers.size !== 0) throw new Error('user already exists');
  if (testData.sessions.size !== 0) throw new Error('session already exists');
  testData.extendedUsers.createPast(1, { role: 'admin', ...options });
  const { expiresAt } = testData.sessions.createNew();

  localStorage.setItem(
    'sessionExpires',
    DateTime.fromISO(expiresAt).toMillis().toString()
  );

  loggedIn = true;
};

mockLogin.setRequestData = (store) => {
  if (loggedIn) {
    store.commit('setFromResponse', {
      key: 'session',
      response: { status: 200, data: testData.sessions.first() }
    });
    store.commit('setFromResponse', {
      key: 'currentUser',
      response: { status: 200, data: testData.extendedUsers.first() }
    });
  }
};

mockLogin.reset = () => { loggedIn = false; };
