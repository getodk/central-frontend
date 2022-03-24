import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('Home', () => {
  describe('initial requests', () => {
    it('sends the correct requests', () => {
      mockLogin();
      return load('/', { root: false }).testRequests([
        { url: '/v1/projects', extended: true },
        { url: '/v1/users' }
      ]);
    });

    it('does not send a request for users for a user without a sidewide role', () => {
      mockLogin({ role: 'none' });
      return load('/', { root: false }, { users: false }).testRequests([
        { url: '/v1/projects', extended: true }
      ]);
    });
  });
});
