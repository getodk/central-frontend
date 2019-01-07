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
        .respondWithData(() => testData.simpleProjects.createPast(1).last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1');
        }));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('shows counts under Right Now', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.simpleProjects.createPast(1).last())
        .respondWithData(() => testData.extendedFieldKeys.createPast(2).sorted())
        .respondWithData(() => testData.extendedForms.createPast(3).sorted())
        .afterResponses(app => {
          const counts = app.find('.project-overview-right-now-count');
          counts.map(count => count.text().trim()).should.eql(['2', '3']);
        }));
  });
});
