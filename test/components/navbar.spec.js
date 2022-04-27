import Navbar from '../../src/components/navbar.vue';

import testData from '../data';
import { load } from '../util/http';
import { testRouter } from '../util/router';

describe('Navbar', () => {
  describe('visibility', () => {
    it('does not show the navbar during the initial navigation', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      let wasHidden = false;
      const addHook = (router) => {
        router.afterEach(() => {
          wasHidden = document.querySelector('.navbar').parentElement.style.display === 'none';
        });
      };
      return load('/login', {
        container: { router: testRouter(addHook) },
        attachTo: document.body
      })
        .restoreSession()
        .respondFor('/', { users: false })
        .afterResponses(app => {
          wasHidden.should.be.true();
          app.getComponent(Navbar).should.be.visible();
        });
    });

    it('shows the navbar for AccountClaim', () => {
      const location = {
        path: '/account/claim',
        query: { token: 'a'.repeat(64) }
      };
      return load(location).then(app => {
        app.getComponent(Navbar).should.be.visible();
      });
    });
  });
});
