import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';

describe('FormSettings', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/projects/1/forms/f/settings')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/projects/1/forms/f/settings')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() =>
          testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f/settings');
        }));

    describe('archived project', () => {
      beforeEach(mockLogin);

      it('does not render the Settings tab', () =>
        mockRoute('/projects/1/forms/f')
          .respondWithData(() =>
            testData.extendedProjects.createPast(1, { archived: true }).last())
          .respondWithData(() =>
            testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .afterResponses(app => {
            app.find('#page-head .nav-tabs a').map(a => a.text()).should.eql([
              'Overview',
              'Submissions'
            ]);
          }));

      it('redirects a user whose first navigation is to the tab', () =>
        mockRoute('/projects/1/forms/f/settings')
          .respondWithData(() =>
            testData.extendedProjects.createPast(1, { archived: true }).last())
          .respondWithData(() =>
            testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .respondWithData(() => testData.extendedProjects.sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a user who navigates to the tab from another tab', () =>
        mockRoute('/projects/1/forms/f')
          .respondWithData(() =>
            testData.extendedProjects.createPast(1, { archived: true }).last())
          .respondWithData(() =>
            testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .complete()
          .route('/projects/1/forms/f/settings')
          .respondWithData(() => testData.extendedProjects.sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a user navigating from a different project', () =>
        mockRoute('/projects/1/forms/f1/settings')
          .respondWithData(() => testData.extendedProjects.createPast(1).last())
          .respondWithData(() =>
            testData.extendedForms.createPast(1, { xmlFormId: 'f1' }).last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .complete()
          .route('/projects/2/forms/f2/settings')
          .respondWithData(() =>
            testData.extendedProjects.createPast(1, { archived: true }).last())
          .respondWithData(() => testData.extendedForms
            .createPast(1, {
              project: testData.extendedProjects.last(),
              xmlFormId: 'f2'
            })
            .last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .respondWithData(() => testData.extendedProjects.sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });
  });
});
