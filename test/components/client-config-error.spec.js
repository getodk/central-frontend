import { isNavigationFailure } from 'vue-router';

import { load } from '../util/http';
import { wait } from '../util/util';

const loadWithError = () => {
  const container = { config: false };
  return load('/login', { container })
    .restoreSession(false)
    .respond(() => ({ status: 502 })); // config
};

describe('ClientConfigError', () => {
  it('prevents navigation away', async () => {
    const app = await loadWithError();

    await app.get('.navbar-brand').trigger('click');
    await wait();
    app.vm.$route.path.should.equal('/load-error');

    isNavigationFailure(await app.vm.$router.push('/login')).should.be.true;
  });
});
