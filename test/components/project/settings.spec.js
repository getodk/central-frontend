import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';

describe('ProjectSettings', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/projects/1/settings')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/projects/1/settings')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/settings');
        }));
  });
});
