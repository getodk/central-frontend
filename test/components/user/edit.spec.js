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

    it('updates currentUser if editing the current user', () =>
      load('/')
        .afterResponses(() => {
          testData.extendedUsers.update(0, { displayName: 'ALICE' });
        })
        .load('/account/edit')
        .afterResponses(app => {
          const { displayName } = app.vm.$store.state.request.data.currentUser;
          displayName.should.equal('ALICE');
        }));

    it('does not update currentUser if editing a different user', () => {
      const { id } = testData.extendedUsers
        .createPast(1, { displayName: 'ALICE' })
        .last();
      return load('/')
        .complete()
        .load(`/users/${id}`)
        .afterResponses(app => {
          const { displayName } = app.vm.$store.state.request.data.currentUser;
          displayName.should.equal('Alice');
        });
    });
  });
});
