import UserNew from '../../../src/components/user/new.vue';
import UserRow from '../../../src/components/user/row.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

describe('UserNew', () => {
  beforeEach(() => {
    mockLogin({ email: 'some@email.com', displayName: 'Some Name' });
  });

  it('toggles the modal', () =>
    load('/users', { root: false }).testModalToggles({
      modal: UserNew,
      show: '#user-list-new-button',
      hide: '.btn-link'
    }));

  describe('introductory text', () => {
    it('shows the correct text if OIDC is not enabled', () => {
      const modal = mount(UserNew, {
        props: { state: true }
      });
      const text = modal.get('.modal-introduction').text();
      text.should.include('the email address you provide will be sent instructions on how to set a password');
    });

    it('shows the correct text if OIDC is enabled', () => {
      const modal = mount(UserNew, {
        props: { state: true },
        container: {
          config: { oidcEnabled: true }
        }
      });
      const text = modal.get('.modal-introduction').text();
      text.should.startWith('Users on your login server must have a Central account to log in to Central.');
    });
  });

  it('focuses the email input', () => {
    const modal = mount(UserNew, {
      props: { state: true },
      attachTo: document.body
    });
    modal.get('input[type="email"]').should.be.focused();
  });

  it('resets the form after the modal is hidden', async () => {
    const modal = mount(UserNew, {
      props: { state: true }
    });
    await modal.get('input[type="email"]').setValue('new@email.com');
    await modal.get('input[type="text"]').setValue('New Name');
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.get('input[type="email"]').element.value.should.equal('');
    modal.get('input[type="text"]').element.value.should.equal('');
  });

  describe('request', () => {
    it('sends the correct request', () =>
      mockHttp()
        .mount(UserNew, {
          props: { state: true }
        })
        .request(async (modal) => {
          await modal.get('input[type="email"]').setValue('new@email.com');
          return modal.get('form').trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/users',
          data: { email: 'new@email.com' }
        }]));

    it('sends the display name if there is one', () =>
      mockHttp()
        .mount(UserNew, {
          props: { state: true }
        })
        .request(async (modal) => {
          await modal.get('input[type="email"]').setValue('new@email.com');
          await modal.get('input[type="text"]').setValue('New Name');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { data }) => {
          data.displayName.should.equal('New Name');
        })
        .respondWithProblem());
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserNew, {
        props: { state: true }
      })
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input[type="email"]').setValue('new@email.com');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('custom alert messages', () => {
    it('shows a custom message for a duplicate email', () =>
      mockHttp()
        .mount(UserNew, {
          props: { state: true }
        })
        .request(async (modal) => {
          await modal.get('input[type="email"]').setValue('new@email.com');
          return modal.get('form').trigger('submit');
        })
        .respondWithProblem({
          code: 409.3,
          message: 'A resource already exists with email,deleted value(s) of new@email.com,false.',
          details: {
            fields: ['email', 'deleted'],
            values: ['new@email.com', false]
          }
        })
        .afterResponse(modal => {
          modal.should.alert('danger', (message) => {
            message.should.startWith('It looks like new@email.com already has an account.');
          });
        }));

    // I don't think a different uniqueness violation is currently possible.
    // This is mostly about future-proofing.
    it('shows the default message for a different uniqueness violation', () =>
      mockHttp()
        .mount(UserNew, {
          props: { state: true }
        })
        .request(async (modal) => {
          await modal.get('input[type="email"]').setValue('new@email.com');
          return modal.get('form').trigger('submit');
        })
        .respondWithProblem({
          code: 409.3,
          message: 'A resource already exists with foo value(s) of bar.',
          details: { fields: ['foo'], values: ['bar'] }
        })
        .afterResponse(modal => {
          modal.should.alert('danger', 'A resource already exists with foo value(s) of bar.');
        }));
  });

  describe('after a successful response', () => {
    const submitWithSuccess = () => load('/users', { root: false })
      .complete()
      .request(async (component) => {
        await component.get('#user-list-new-button').trigger('click');
        const modal = component.getComponent(UserNew);
        await modal.get('input[type="email"]').setValue('new@email.com');
        return modal.get('form').trigger('submit');
      })
      .respondWithData(() => testData.standardUsers.createNew({
        email: 'new@email.com',
        displayName: 'New Name'
      }))
      .respondFor('/users');

    it('hides the modal', () =>
      submitWithSuccess().afterResponses(component => {
        component.getComponent(UserNew).props().state.should.be.false;
      }));

    it('refreshes the data', () =>
      submitWithSuccess().afterResponses(component => {
        component.findAllComponents(UserRow).length.should.equal(2);
      }));

    it('shows a success alert', () =>
      submitWithSuccess().afterResponses(component => {
        component.should.alert('success');
      }));

    it('includes display name in alert even if it was not specified', () =>
      submitWithSuccess().afterResponses(component => {
        component.should.alert('success', (message) => {
          message.should.include('New Name');
        });
      }));
  });
});
