import faker from '../../faker';
import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../util';

describe('RootHome', () => {
  describe('anonymous users', () => {
    it('routes an anonymous user to login', () =>
      mockRoute('/')
        .restoreSession(false)
        .afterResponse(app => app.vm.$route.path.should.equal('/login')));

    it('routes the user back after login', () =>
      mockRouteThroughLogin('/')
        .respondWithProblem()
        .respondWithProblem()
        .respondWithProblem()
        .afterResponses(app => app.vm.$route.path.should.equal('/')));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('routes user to site root after user clicks on navbar header', () =>
      mockRoute('/users')
        .respondWithData(() => testData.administrators.sorted())
        .complete()
        .request(app => trigger.click(app, '.navbar-brand'))
        .respondWithProblems([500, 500, 500])
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    describe('loading message', () => {
      it('shows the loading message until all three responses');
      it('immediately hides the loading message after an error');
    });

    it('shows the correct counts', () =>
      mockRoute('/')
        // We do not actually fill the array with data, as the page does not use
        // the data.
        .respondWithData(() => new Array(1000))
        .respondWithData(() => new Array(1000))
        .respondWithData(() => new Array(1000))
        .afterResponses(app => {
          const counts = app
            .find('.root-entity-count a')
            .map(a => a.text().trim());
          counts.should.eql(['1,000', '1,000', '1,000']);
        }));

    describe('clicking anywhere on the block routes to correct page', () => {
      const routes = ['/users', '/users', '/users'];
      for (let i = 0; i < routes.length; i += 1) {
        it(`renders 4 links in entity ${i}`, () =>
          mockRoute('/')
            .respondWithData(() => new Array(1))
            .respondWithData(() => new Array(1))
            .respondWithData(() => new Array(1))
            .afterResponses(app => {
              app.find('.root-entity')[i].find('a').length.should.equal(4);
            }));

        it(`routes to correct page after user clicks a link in entity ${i}`, () =>
          mockRoute('/')
            .respondWithData(() => new Array(1))
            .respondWithData(() => new Array(1))
            .respondWithData(() => new Array(1))
            .complete()
            .request(app => {
              const a = app.find('.root-entity')[i].find('a');
              return trigger.click(faker.random.arrayElement(a));
            })
            .respondWithProblem()
            .afterResponse(app => {
              app.vm.$route.path.should.equal(routes[i]);
            }));
      }
    });
  });
});
