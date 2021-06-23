import UserResetPassword from '../../../src/components/user/reset-password.vue';

import User from '../../../src/presenters/user';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('UserResetPassword', () => {
  beforeEach(() => {
    mockLogin({ email: 'alice@getodk.org', displayName: 'Alice' });
  });

  it('toggles the modal', () =>
    load('/users', { root: false }).testModalToggles({
      modal: UserResetPassword,
      show: '.user-row .reset-password',
      hide: '.btn-link'
    }));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserResetPassword, {
        propsData: {
          state: true,
          user: new User(testData.standardUsers.first())
        }
      })
      .testStandardButton({
        button: '#user-reset-password-button',
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const submit = () => load('/users', { root: false })
      .complete()
      .request(async (component) => {
        await component.get('.user-row .reset-password').trigger('click');
        return component.get('#user-reset-password-button').trigger('click');
      })
      .respondWithSuccess();

    it('hides the modal', async () => {
      const component = await submit();
      component.getComponent(UserResetPassword).props().state.should.be.false();
    });

    it('shows a success message', async () => {
      const component = await submit();
      component.should.alert('success', (message) => {
        message.should.containEql('Alice');
        message.should.containEql('alice@getodk.org');
      });
    });
  });
});
