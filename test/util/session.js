import { DateTime } from 'luxon';

import testData from '../data';
import { setData } from './store';

// eslint-disable-next-line import/prefer-default-export
export const mockLogin = (options = undefined) => {
  if (testData.extendedUsers.size !== 0) throw new Error('user already exists');
  const currentUser = testData.extendedUsers
    .createPast(1, { role: 'admin', ...options })
    .first();
  const session = testData.sessions.createNew();
  setData({ session, currentUser });
  localStorage.setItem(
    'sessionExpires',
    DateTime.fromISO(session.expiresAt).toMillis().toString()
  );
};
