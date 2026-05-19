import AccountLogin from '../../../src/components/account/login.vue';
import ConfigError from '../../../src/components/config-error.vue';

import { load } from '../../util/http';

describe('AccountPage', () => {
  it('sends the correct initial requests', () =>
    load('/login')
      .restoreSession(false)
      .testRequestsInclude([{ url: '/v1/config/public' }]));

  it('renders ConfigError after a response error', () =>
    load('/login', {}, false)
      .restoreSession(false)
      .respondWithProblem() // serverConfig
      .afterResponses(app => {
        const { error } = app.getComponent(ConfigError).props();
        error.should.be.an('error');
        error.response.data.code.should.equal(500.1);

        app.findComponent(AccountLogin).exists().should.be.false;
        // No redirect to /load-error
        app.vm.$route.path.should.equal('/login');
      }));
});
