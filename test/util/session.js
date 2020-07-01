import User from '../../src/presenters/user';
import store from '../../src/store';
import testData from '../data';

// eslint-disable-next-line import/prefer-default-export
export const mockLogin = (options = undefined) => {
  if (testData.extendedUsers.size !== 0) throw new Error('user already exists');
  const session = testData.sessions.createNew();
  store.commit('setData', { key: 'session', value: session });
  const user = testData.extendedUsers
    .createPast(1, { role: 'admin', ...options })
    .first();
  store.commit('setData', { key: 'currentUser', value: new User(user) });
  store.commit('setSendInitialRequests', false);
};
