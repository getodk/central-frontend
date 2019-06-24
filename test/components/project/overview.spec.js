import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../event';

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

    describe('Right Now', () => {
      it('shows counts', () =>
        mockRoute('/projects/1')
          .respondWithData(() =>
            testData.extendedProjects.createPast(1, { appUsers: 2 }).last())
          .respondWithData(() => testData.extendedForms.createPast(3).sorted())
          .afterResponses(app => {
            const counts = app.find('.summary-item-heading');
            counts.map(count => count.text().trim()).should.eql(['2', '3']);
          }));

      const targets = [
        ['icon', '.summary-item-icon-container'],
        ['count', '.summary-item-heading a'],
        ['description', '.summary-item-body a']
      ];
      for (const [description, selector] of targets) {
        it(`navigates to app users page upon a click on app users ${description}`, () =>
          mockRoute('/projects/1')
            .respondWithData(() =>
              testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
            .respondWithData(() => testData.extendedForms.sorted())
            .complete()
            .request(app => trigger.click(app, selector))
            .respondWithData(() =>
              testData.extendedFieldKeys.createPast(1).sorted())
            .then(app => {
              app.vm.$route.path.should.equal('/projects/1/app-users');
            }));

        it(`scrolls down the page upon a click on the forms ${description}`, () =>
          mockRoute('/projects/1', { attachToDocument: true })
            .respondWithData(() => testData.extendedProjects.createPast(1).last())
            .respondWithData(() => testData.extendedForms.createPast(1).sorted())
            .afterResponses(app => {
              window.pageYOffset.should.equal(0);
              return trigger.click(app.find(selector)[1]);
            })
            // Wait for the animation to complete.
            .then(() => new Promise(resolve => {
              setTimeout(resolve, 400);
            }))
            .then(() => {
              window.pageYOffset.should.not.equal(0);
            }));
      }
    });
  });
});
