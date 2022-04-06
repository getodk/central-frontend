import HomeConfigSection from '../../src/components/home/config-section.vue';

import store from '../../src/store';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('Home', () => {
  describe('initial requests', () => {
    it('sends the correct requests', () => {
      mockLogin();
      return load('/', { root: false }).testRequests([
        { url: '/v1/projects', extended: true },
        { url: '/v1/users' }
      ]);
    });

    it('does not send request for users if user does not have a sidewide role', () => {
      mockLogin({ role: 'none' });
      return load('/', { root: false }, { users: false }).testRequests([
        { url: '/v1/projects', extended: true }
      ]);
    });
  });

  describe('configurable section', () => {
    beforeEach(mockLogin);

    it('passes the config to the component', async () => {
      store.commit('setConfig', {
        key: 'home',
        value: { title: 'Some Title', body: 'Some **body** text' }
      });
      const app = await load('/', { root: false });
      const props = app.getComponent(HomeConfigSection).props();
      props.title.should.equal('Some Title');
      props.body.should.equal('Some **body** text');
    });

    it('does not render the section if the config is null', async () => {
      const app = await load('/', { root: false });
      app.findComponent(HomeConfigSection).exists().should.be.false();
    });
  });
});
