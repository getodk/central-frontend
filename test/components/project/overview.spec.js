import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';

describe('ProjectOverview', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/projects/1')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/projects/1')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1');
        }));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('does not send a new request if user navigates back to tab', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms.sorted())
        .complete()
        .route('/projects/1/settings')
        .complete()
        .route('/projects/1')
        .respondWithData([/* no responses */]));
  });
});
