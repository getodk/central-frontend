import createTestContainer from '../util/container';
import testData from '../data';
import { mockHttp } from '../util/http';
import { mockLogin } from '../util/session';

describe('createRequestData()', () => {
  describe('abortRequests()', () => {
    it('aborts all requests', () => {
      mockLogin();
      const container = createTestContainer();
      const { requestData } = container;
      return mockHttp()
        .request(() => Promise.allSettled(
          requestData.currentUser.request('/v1/users/current'),
          requestData.projects.request('/v1/projects'),
          requestData.users.request('/v1/users')
        ))
        .respondWithData(() => testData.standardUsers.first())
        .respondWithData(() => testData.standardProjects.sorted())
        .beforeEachResponse((_, { url }) => {
          if (url === '/v1/projects') {
            requestData.abortRequests();
            requestData.projects.awaitingResponse.value.should.be.false();
            requestData.users.awaitingResponse.value.should.be.false();
          }
        })
        .afterResponses(() => {
          should.exist(requestData.currentUser.data);
          should.not.exist(requestData.projects.data);
          should.not.exist(requestData.users.data);
        });
    });
  });
});
