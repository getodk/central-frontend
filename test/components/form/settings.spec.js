import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';

const settingsPath = (form) => `/forms/${form.xmlFormId}/settings`;

describe('FormSettings', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute(settingsPath(testData.extendedForms.createPast(1).last()))
        .respondWithProblem(404)
        .afterResponse(app => app.vm.$route.path.should.equal('/login')));

    it('redirects the user back after login', () => {
      const path = settingsPath(testData.extendedForms.createPast(1).last());
      return mockRouteThroughLogin(path)
        .respondWithData(() => testData.extendedForms.last())
        .afterResponse(app => app.vm.$route.path.should.equal(path));
    });
  });
});
