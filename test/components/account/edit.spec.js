import UserEdit from '../../../src/components/user/edit.vue';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('AccountEdit', () => {
  beforeEach(mockLogin);

  it('renders a UserEdit component', async () => {
    const component = await load('/account/edit', { root: false });
    component.find(UserEdit).length.should.equal(1);
  });

  it('passes the id of the current user', async () => {
    const component = await load('/account/edit', { root: false });
    component.first(UserEdit).getProp('id').should.equal('1');
  });
});
