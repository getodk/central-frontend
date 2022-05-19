import NotFound from '../../src/components/not-found.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('NotFound', () => {
  beforeEach(mockLogin);

  it('renders NotFound for an unknown route', async () => {
    const app = await load('/not-found');
    app.findComponent(NotFound).exists().should.be.true();
  });

  it('renders NotFound if the route path has multiple components', async () => {
    const app = await load('/not/found');
    app.findComponent(NotFound).exists().should.be.true();
  });
});
