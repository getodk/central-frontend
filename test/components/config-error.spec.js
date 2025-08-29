import { isNavigationFailure } from 'vue-router';

import { load } from '../util/http';
import { wait } from '../util/util';

const loadWithError = () => {
  const container = { config: false };
  return load('/login', { container })
    .restoreSession(false)
    .respond(() => ({ status: 502 })); // config
};

describe('ConfigError', () => {
  it('shows the error', async () => {
    const app = await loadWithError();
    const text = app.get('#config-error .panel-body').text();
    text.should.equal('There was an error loading Central. Something went wrong: error code 502.');
  });

  it('prevents navigation away', async () => {
    const app = await loadWithError();

    await app.get('.navbar-brand').trigger('click');
    await wait();
    app.vm.$route.path.should.equal('/load-error');

    isNavigationFailure(await app.vm.$router.push('/login')).should.be.true;
  });
});
