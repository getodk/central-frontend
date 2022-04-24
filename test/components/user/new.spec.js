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
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/users');
          data.should.eql({ email: 'new@email.com' });
        })
        .respondWithProblem());

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
        component.getComponent(UserNew).props().state.should.be.false();
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
          message.should.containEql('New Name');
        });
      }));
  });
});
