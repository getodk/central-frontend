import Navbar from '../../src/components/navbar.vue';

import router from '../../src/router';

import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { trigger } from '../util/event';

describe('Navbar', () => {
  describe('visibility', () => {
    it('does not show the navbar until the first confirmed navigation', () => {
      testData.extendedUsers.createPast(1);
      let wasHidden;
      const removeGuard = router.afterEach(() => {
        wasHidden = document.querySelector('.navbar').style.display === 'none';
      });
      return load('/login', { attachToDocument: true })
        .restoreSession(true)
        .respondFor('/')
        .afterResponses(app => {
          wasHidden.should.be.true();
          app.first(Navbar).should.be.visible();
        })
        .finally(removeGuard);
    });

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
