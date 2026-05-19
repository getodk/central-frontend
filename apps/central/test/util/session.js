import { DateTime } from 'luxon';
import { clone } from 'ramda';
import { faker } from '@faker-js/faker';

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

  const csrf = faker.string.alphanumeric(64);
  document.cookie = `__csrf=${csrf}`;

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

// Undoes the effects of mockLogin().
mockLogin.reset = () => {
  if (!loggedIn) return;

  if (testData.extendedUsers.size === 1 && testData.sessions.size === 1) {
    testData.extendedUsers.reset();
    testData.sessions.reset();
  } else {
    testData.extendedUsers.splice(0, 1);
    testData.sessions.splice(0, 1);
  }

  localStorage.removeItem('sessionExpires');

  document.cookie = document.cookie.split('; ')
    .filter(cookie => !cookie.startsWith('__csrf='))
    .join('; ');

  loggedIn = false;
};
