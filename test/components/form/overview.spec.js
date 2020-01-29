import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../util/session';
import { mockRoute } from '../../util/http';

describe('FormOverview', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/projects/1/forms/f')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/projects/1/forms/f')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f' })
          .last())
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .respondWithData(() => []) // formActors
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f');
        }));

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.createProjectAndFormWithoutSubmissions({
          project: { role: 'viewer' },
          form: { xmlFormId: 'f' }
        });
      });

      it('redirects a project viewer whose first navigation is to the tab', () =>
        mockRoute('/projects/1/forms/f')
          .respondWithData(() => testData.extendedProjects.last())
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.standardFormAttachments.sorted())
          .respondWithProblem(403.1)
          .respondWithData(() => testData.extendedProjects.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a project viewer navigating from project overview', () =>
        mockRoute('/projects/1')
          .respondWithData(() => testData.extendedProjects.last())
          .respondWithData(() => testData.extendedForms.sorted())
          .complete()
          .route('/projects/1/forms/f')
          .respondWithData(() => testData.extendedProjects.sorted())
          .afterResponse(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });
  });
});
