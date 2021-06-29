import UserEdit from '../../../src/components/user/edit.vue';

import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('AccountEdit', () => {
  beforeEach(mockLogin);

  it('renders a UserEdit component', async () => {
    const component = await load('/account/edit', { root: false });
    component.findComponent(UserEdit).exists().should.be.true();
  });

  it('passes the id of the current user', async () => {
    const component = await load('/account/edit', { root: false });
    component.getComponent(UserEdit).props().id.should.equal('1');
  });
});
