import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';

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
        .respondWithData(() => testData.simpleProjects.createPast(1).last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/projects/1');
        }));
  });
});
