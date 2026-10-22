import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('UserHome', () => {
  beforeEach(mockLogin);

  it('renders the user home page', async () => {
    const app = await load('/users', { attachTo: document.body });
    app.find('#user-home').exists().should.be.true;
  });
});
