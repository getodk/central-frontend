import UserResetPassword from '../../../src/components/user/reset-password.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

const mountOptions = () => ({
  props: { state: true, user: testData.standardUsers.first() }
});

describe('UserResetPassword', () => {
  beforeEach(() => {
    mockLogin({ email: 'alice@getodk.org', displayName: 'Alice' });
  });

  describe('reset password button', () => {
    it('toggles the modal', () =>
      load('/users', { root: false }).testModalToggles({
        modal: UserResetPassword,
        show: '.user-row .reset-password',
        hide: '.btn-link'
      }));

    it('is not rendered if OIDC is enabled', async () => {
      const component = await load('/users', {
        container: {
          config: { oidcEnabled: true },
        },
        root: false
      });
      component.find('.user-row .reset-password').exists().should.be.false;
    });

    it('is disabled for the current user', async () => {
      const component = await load('/users', { root: false });
      const a = component.get('.user-row .reset-password');
      a.element.parentNode.classList.contains('disabled').should.be.true;
      a.should.have.ariaDescription(/^You may not reset your own password/);
      await a.should.have.tooltip();
    });
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(UserResetPassword, mountOptions())
      .request(modal => modal.get('.btn-primary').trigger('click'))
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/users/reset/initiate?invalidate=true',
        data: { email: 'alice@getodk.org' }
      }]));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserResetPassword, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const submit = () => load('/users', { root: false })
      .complete()
      .request(async (component) => {
        await component.get('.user-row .reset-password').trigger('click');
        return component.get('#user-reset-password .btn-primary').trigger('click');
      })
      .respondWithSuccess();

    it('hides the modal', async () => {
      const component = await submit();
      component.getComponent(UserResetPassword).props().state.should.be.false;
    });

    it('shows a success alert', async () => {
      const component = await submit();
      component.should.alert('success', (message) => {
        message.should.include('Alice');
        message.should.include('alice@getodk.org');
      });
    });
  });
});
