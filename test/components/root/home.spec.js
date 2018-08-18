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
      mockRoute('/forms')
        .respondWithData(() => testData.forms.sorted())
        .complete()
        .request(app => trigger.click(app.first('.navbar-brand')))
        .respondWithProblem()
        .respondWithProblem()
        .respondWithProblem()
        .afterResponses(app => app.vm.$route.path.should.equal('/')));

    describe('loading message', () => {
      it('shows the loading message until all three responses');
      it('immediately hides the loading message after an error');
    });

    it('shows the correct counts', () => {
      const users = faker.random.number();
      const fieldKeys = faker.random.number();
      const forms = faker.random.number();
      // Using mockRoute() rather than mockHttp() because the page contains
      // <router-link> tags.
      return mockRoute('/')
        // We don't actually fill the array with data, as the page does not use
        // the data.
        .respondWithData(() => new Array(users))
        .respondWithData(() => new Array(fieldKeys))
        .respondWithData(() => new Array(forms))
        .afterResponses(app => {
          const counts = app
            .find('.root-entity-count a')
            .map(a => a.text().trim());
          counts.length.should.equal(3);
          counts[0].should.equal(users.toLocaleString());
          counts[1].should.equal(fieldKeys.toLocaleString());
          counts[2].should.equal(forms.toLocaleString());
        });
    });

    describe('clicking anywhere on the block routes to correct page', () => {
      const routes = ['/users', '/users/field-keys', '/forms'];
      for (let i = 0; i < routes.length; i += 1) {
        it(`renders 4 links in entity ${i}`, () =>
          mockRoute('/')
            .respondWithData(() => new Array(1))
            .respondWithData(() => new Array(1))
            .respondWithData(() => new Array(1))
            .afterResponses(app =>
              app.find('.root-entity')[i].find('a').length.should.equal(4)));

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
            .afterResponse(app => app.vm.$route.path.should.equal(routes[i])));
      }
    });
  });
});
