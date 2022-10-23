import { START_LOCATION } from 'vue-router';

import Navbar from '../../src/components/navbar.vue';

import testData from '../data';
import { load } from '../util/http';

describe('Navbar', () => {
  describe('visibility', () => {
    it('does not show the navbar during the initial navigation', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      let wasHidden = false;
      return load('/login')
        .beforeAnyResponse(app => {
          app.vm.$router.currentRoute.value.should.equal(START_LOCATION);
          app.vm.$router.afterEach(() => {
            const { display } = app.getComponent(Navbar).element.style;
            wasHidden = display === 'none';
          });
        })
        .restoreSession()
        .respondFor('/', { users: false })
        .afterResponses(app => {
          wasHidden.should.be.true();
          app.getComponent(Navbar).should.be.visible();
        });
    });

    it('shows the navbar for AccountClaim', async () => {
      const app = await load(`/account/claim?token=${'a'.repeat(64)}`);
      app.getComponent(Navbar).should.be.visible();
    });
  });
});
