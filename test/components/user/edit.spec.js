import NotFound from '../../../src/components/not-found.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('UserEdit', () => {
  it('requires the id route param to be integer', async () => {
    const app = await load('/users/x/edit');
    app.findComponent(NotFound).exists().should.be.true();
  });

  describe('requestData reconciliation', () => {
    beforeEach(() => {
      mockLogin({ displayName: 'Alice' });
    });

    it('updates currentUser if editing the current user', async () => {
      testData.extendedUsers.update(0, { displayName: 'ALICE' });
      const component = await load('/account/edit', { root: false });
      const { currentUser } = component.vm.$container.requestData;
      currentUser.displayName.should.equal('ALICE');
    });

    it('does not update currentUser if editing a different user', async () => {
      const { id } = testData.extendedUsers
        .createPast(1, { displayName: 'ALICE' })
        .last();
      const component = await load(`/users/${id}`, { root: false });
      const { currentUser } = component.vm.$container.requestData;
      currentUser.displayName.should.equal('Alice');
    });
  });
});
