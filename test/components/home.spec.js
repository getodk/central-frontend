import HomeConfigSection from '../../src/components/home/config-section.vue';
import { loadLocale } from '../../src/util/i18n';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('Home', () => {
  describe('initial requests', () => {
    it('sends the correct requests', () => {
      mockLogin();
      return load('/', { root: false }).testRequests([
        { url: '/v1/projects?forms=true&datasets=true' },
        { url: '/v1/users' }
      ]);
    });

    it('does not send request for users if user does not have a sidewide role', () => {
      mockLogin({ role: 'none' });
      return load('/', { root: false }, { users: false }).testRequests([
        { url: '/v1/projects?forms=true&datasets=true' }
      ]);
    });
  });

  describe('configurable section', () => {
    beforeEach(mockLogin);

    it('passes the config to the component', async () => {
      const app = await load('/', {
        container: {
          config: {
            home: { title: 'Some Title', body: 'Some **body** text' }
          }
        },
        root: false
      });
      const props = app.getComponent(HomeConfigSection).props();
      props.title.should.equal('Some Title');
      props.body.should.equal('Some **body** text');
    });

    it('does not render the section if the config is null', async () => {
      const app = await load('/', { root: false });
      app.findComponent(HomeConfigSection).exists().should.be.false;
    });
  });

  describe('news section', () => {
    beforeEach(mockLogin);

    it('should have correct iframe src', async () => {
      const app = await load('/', { root: false });
      app.find('iframe').attributes().src.should.be.equal('https://getodk.github.io/central/news.html?outdatedVersionWarning=false&lang=en');
    });

    it('should update language in the iframe src', async () => {
      const app = await load('/', { root: false });
      await loadLocale(app.vm.$container, 'zh-Hant');
      app.find('iframe').attributes().src.should.be.equal('https://getodk.github.io/central/news.html?outdatedVersionWarning=false&lang=zh-Hant');
    });
  });
});
