import UserRetire from '../../../src/components/user/retire.vue';
import UserRow from '../../../src/components/user/row.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('UserRetire', () => {
  beforeEach(() => {
    mockLogin({ email: 'b@email.com', displayName: 'Person B' });
  });

  describe('retire user action', () => {
    it('toggles the modal', () => {
      testData.extendedUsers.createPast(1, { email: 'a@email.com' });
      return load('/users', { root: false }).testModalToggles({
        modal: UserRetire,
        show: '.user-row .retire-user',
        hide: '.btn-link'
      });
    });

    it('is disabled for the current user', async () => {
      const component = await load('/users', { root: false });
      const a = component.get('.user-row .retire-user');
      const li = a.element.parentNode;
      li.classList.contains('disabled').should.be.true();
      li.getAttribute('title').should.equal('You may not retire yourself.');
      await a.trigger('click');
      component.getComponent(UserRetire).props().state.should.be.false();
    });
  });

  it('implements some standard button things', () => {
    const user = testData.standardUsers
      .createPast(1, { email: 'a@email.com' })
      .last();
    return mockHttp()
      .mount(UserRetire, {
        props: { state: true, user }
      })
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('after a successful response', () => {
    const retire = () => {
      testData.extendedUsers.createPast(1, {
        email: 'a@email.com',
        displayName: 'Person A'
      });
      return load('/users', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('.user-row .retire-user').trigger('click');
          return component.get('#user-retire .btn-danger').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedUsers.splice(1, 1);
          return { success: true };
        })
        .respondFor('/users');
    };

    it('hides the modal', async () => {
      const component = await retire();
      component.getComponent(UserRetire).props().state.should.be.false();
    });

    it('shows a success alert', async () => {
      const component = await retire();
      component.should.alert('success', (message) => {
        message.should.containEql('Person A');
      });
    });

    it('renders the correct number of rows', async () => {
      const component = await retire();
      component.findAllComponents(UserRow).length.should.equal(1);
    });
  });
});
