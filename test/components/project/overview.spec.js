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
        .respondWithData(() => testData.simpleProjects.createPast(1).last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1');
        }));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('displays the navbar projects link as active', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.simpleProjects.createPast(1).last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponses(app => {
          const $li = $(app.vm.$el).find('#navbar-projects-link').parent();
          $li.length.should.equal(1);
          $li.hasClass('active').should.be.true();
        }));

    describe('Right Now', () => {
      it('shows counts', () =>
        mockRoute('/projects/1')
          .respondWithData(() => testData.simpleProjects.createPast(1).last())
          .respondWithData(() => testData.extendedFieldKeys.createPast(2).sorted())
          .respondWithData(() => testData.extendedForms.createPast(3).sorted())
          .afterResponses(app => {
            const counts = app.find('.project-overview-right-now-count');
            counts.map(count => count.text().trim()).should.eql(['2', '3']);
          }));

      const targets = [
        ['icon', '.project-overview-right-now-icon-container'],
        ['count', '.project-overview-right-now-count a'],
        ['description', '.project-overview-right-now-description a']
      ];
      for (const [description, selector] of targets) {
        it(`navigates to app users page upon a click on app users ${description}`, () =>
          mockRoute('/projects/1')
            .respondWithData(() => testData.simpleProjects.createPast(1).last())
            .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
            .respondWithData(() => testData.extendedForms.sorted())
            .afterResponses(app => trigger.click(app, selector))
            .then(app => {
              app.vm.$route.path.should.equal('/projects/1/app-users');
            }));

        it(`scrolls down the page upon a click on the forms ${description}`, () =>
          mockRoute('/projects/1', { attachToDocument: true })
            .respondWithData(() => testData.simpleProjects.createPast(1).last())
            .respondWithData(() => testData.extendedFieldKeys.sorted())
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
