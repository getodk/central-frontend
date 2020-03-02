import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../util/session';
import { mockRoute } from '../../util/http';

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

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer' });
      });

      it('redirects a project viewer whose first navigation is to the tab', () =>
        mockRoute('/projects/1/settings')
          .respondWithData(() => testData.extendedProjects.last())
          .respondWithData(() => testData.extendedProjects.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a project viewer navigating from another tab', () =>
        mockRoute('/projects/1')
          .respondWithData(() => testData.extendedProjects.last())
          .respondWithData(() => testData.extendedForms.sorted())
          .complete()
          .route('/projects/1/settings')
          .respondWithData(() => testData.extendedProjects.sorted())
          .afterResponse(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });
  });
});
