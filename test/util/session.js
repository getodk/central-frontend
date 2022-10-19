import { DateTime } from 'luxon';
import { clone } from 'ramda';

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

mockLogin.setRequestData = (requestData) => {
  if (loggedIn) {
    requestData.session.setFromResponse({
      status: 200,
      data: clone(testData.sessions.first())
    });
    requestData.currentUser.setFromResponse({
      status: 200,
      data: clone(testData.extendedUsers.first())
    });
  }
};

mockLogin.reset = () => { loggedIn = false; };
