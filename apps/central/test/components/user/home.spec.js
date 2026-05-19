import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('UserHome', () => {
  beforeEach(mockLogin);

  it('shows the correct tabs', async () => {
    const app = await load('/users', { attachTo: document.body });
    const li = app.findAll('#page-head-tabs li');
    li.map(wrapper => wrapper.text()).should.eql(['Web Users']);
    li[0].should.be.visible(true);
  });
});
