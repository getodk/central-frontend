import Navbar from '../../src/components/navbar.vue';

import router from '../../src/router';

import testData from '../data';
import { load } from '../util/http';

describe('Navbar', () => {
  describe('visibility', () => {
    it('does not show the navbar until the first confirmed navigation', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      let wasHidden;
      const removeGuard = router.afterEach(() => {
        wasHidden = document.querySelector('.navbar').style.display === 'none';
      });
      return load('/login', { attachTo: document.body })
        .restoreSession()
        .respondFor('/', { users: false })
        .afterResponses(app => {
          wasHidden.should.be.true();
          app.getComponent(Navbar).should.be.visible();
        })
        .finally(removeGuard);
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
