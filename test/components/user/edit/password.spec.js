import UserEditPassword from '../../../../src/components/user/edit/password.vue';

import testData from '../../../data';
import { load, mockHttp } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mount } from '../../../util/lifecycle';

const mountOptions = () => ({
  requestData: { user: testData.standardUsers.first() }
});
const submit =
  async (component, { validSizePass = true, match = true } = {}) => {
    await component.get('#user-edit-password-old-password').setValue('testPasswordX');
    await component.get('#user-edit-password-new-password').setValue(validSizePass
      ? 'testPasswordY'
      : 'y');
    await component.get('#user-edit-password-confirm').setValue(match
      ? (validSizePass ? 'testPasswordY' : 'y')
      : (validSizePass ? 'testPasswordZ' : 'z'));
    return component.get('#user-edit-password form').trigger('submit');
  };

describe('UserEditPassword', () => {
  beforeEach(mockLogin);

  it('resets the form if the route changes', () => {
    testData.extendedUsers.createPast(1);
    return load('/users/1/edit', {}, {
      user: () => testData.standardUsers.first()
    })
      .afterResponses(async (app) => {
        const oldPassword = app.get('#user-edit-password-old-password');
        const newPassword = app.get('#user-edit-password-new-password');
        const confirm = app.get('#user-edit-password-confirm');
        oldPassword.element.value.should.equal('');
        newPassword.element.value.should.equal('');
        confirm.element.value.should.equal('');
        await oldPassword.setValue('x');
        await newPassword.setValue('y');
        return confirm.setValue('y');
      })
      .load('/users/2/edit')
      .complete()
      .load('/users/1/edit', { user: () => testData.standardUsers.first() })
      .afterResponses(app => {
        app.get('#user-edit-password-old-password').element.value.should.equal('');
        app.get('#user-edit-password-new-password').element.value.should.equal('');
        app.get('#user-edit-password-confirm').element.value.should.equal('');
      });
  });

  it("does not render form if it is not current user's own account", async () => {
    const user = testData.standardUsers.createPast(1).last();
    const component = mount(UserEditPassword, {
      requestData: { user }
    });
    component.find('form').exists().should.be.false();
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .testStandardButton({
        button: 'button',
        request: submit
      }));

  describe('new passwords do not match', () => {
    it('shows a danger alert', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { match: false });
      component.should.alert('danger');
    });

    it('adds .has-error to the fields', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { match: false });
      const formGroups = component.findAll('.form-group');
      formGroups.length.should.equal(3);
      formGroups.at(1).classes('has-error').should.be.true();
      formGroups.at(2).classes('has-error').should.be.true();
    });

    it('removes .has-error once the passwords match', () =>
      mockHttp()
        .mount(UserEditPassword, mountOptions())
        .request(async (component) => {
          await submit(component, { match: false });
          await component.get('#user-edit-password-confirm').setValue('testPasswordY');
          return component.get('form').trigger('submit');
        })
        .beforeAnyResponse(component => {
          const formGroups = component.findAll('.form-group');
          formGroups.at(1).classes('has-error').should.be.false();
          formGroups.at(2).classes('has-error').should.be.false();
        })
        .respondWithSuccess());
  });

  describe('password length does not meet the criteria', () => {
    it('adds .has-error to the field when password length < 10', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { validSizePass: false });
      const formGroups = component.findAll('.form-group');
      formGroups.length.should.equal(3);
      formGroups.at(1).classes('has-error').should.be.true();
    });

    it('removes .has-error once the passwords length > 10', () =>
      mockHttp()
        .mount(UserEditPassword, mountOptions())
        .request(async (component) => {
          await submit(component, { validSizePass: false });
          const newPassword = component.get('#user-edit-password-new-password');
          await newPassword.setValue('testPasswordY');
          await component.get('#user-edit-password-confirm').setValue('testPasswordY');
          return component.get('form').trigger('submit');
        })
        .beforeAnyResponse(component => {
          const formGroups = component.findAll('.form-group');
          formGroups.at(1).classes('has-error').should.be.false();
        })
        .respondWithSuccess());
  });

  it('shows a success alert after a successful response', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(submit)
      .respondWithSuccess()
      .afterResponse(component => {
        component.should.alert('success');
      }));
});
