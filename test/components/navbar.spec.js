import Navbar from '../../src/components/navbar.vue';
import { load, mockRoute } from '../util/http';
import { mockLogin } from '../util/session';
import { trigger } from '../util/event';

describe('Navbar', () => {
  describe('visibility', () => {
    it('does not show the navbar until the first confirmed navigation', () =>
      mockRoute('/login')
        .beforeEachNav(app => {
          app.first(Navbar).should.be.hidden();
        })
        .restoreSession(true)
        .respondFor('/')
        .afterResponses(app => {
          app.first(Navbar).should.be.visible();
        }));

    it('shows the navbar for AccountClaim', () => {
      const location = {
        path: '/account/claim',
        query: { token: 'a'.repeat(64) }
      };
      return load(location).then(app => {
        app.first(Navbar).should.be.visible();
      });
    });
  });

  it('navigates to / after the user clicks "ODK Central"', () => {
    mockLogin();
    return load('/account/edit')
      .complete()
      .request(trigger.click('.navbar-brand'))
      .respondFor('/')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/');
      });
  });
});
