import { noop } from '../../src/util/util';

import createTestContainer from '../util/container';
import testData from '../data';
import { mockHttp } from '../util/http';
import { mockLogin } from '../util/session';

describe('store/modules/request', () => {
  describe('mutations', () => {
    describe('cancelRequests', () => {
      it('cancels all requests', () => {
        mockLogin();
        const container = createTestContainer();
        const { store } = container;
        return mockHttp(container)
          .request(() => store.dispatch('get', [
            { key: 'currentUser', url: '/v1/users/current' },
            { key: 'users', url: '/v1/users' },
            { key: 'roles', url: '/v1/roles' },
            { key: 'projects', url: '/v1/projects' }
          ]).catch(noop))
          .respondWithData(() => testData.standardUsers.last())
          .respondWithProblem()
          .respondWithData(() => testData.standardRoles.sorted())
          .respondWithData(() => testData.standardProjects.sorted())
          .beforeEachResponse((_, { url }) => {
            if (url === '/v1/roles') {
              store.commit('cancelRequests');
              const { requests } = store.state.request;
              requests.currentUser.last.state.should.equal('success');
              requests.users.last.state.should.equal('error');
              requests.roles.last.state.should.equal('canceled');
              requests.projects.last.state.should.equal('canceled');
            }
          })
          .afterResponses(() => {
            const { currentUser, roles, projects } = store.state.request.data;
            should.exist(currentUser);
            should.not.exist(roles);
            should.not.exist(projects);
          });
      });
    });
  });
});
