import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';

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
  });
});
