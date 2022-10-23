import FormGroup from '../../../../src/components/form-group.vue';
import UserEditPassword from '../../../../src/components/user/edit/password.vue';

import useUser from '../../../../src/request-data/user';

import testData from '../../../data';
import { load, mockHttp } from '../../../util/http';
import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockLogin } from '../../../util/session';
import { testRequestData } from '../../../util/request-data';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  container: {
    requestData: testRequestData([useUser], {
      user: testData.standardUsers.first()
    })
  }
});
const submit =
  async (component, { tooShort = false, mismatch = false } = {}) => {
    await component.get('#user-edit-password-old-password').setValue('testPasswordX');
    await component.get('#user-edit-password-new-password').setValue(!tooShort
      ? 'testPasswordY'
      : 'y');
    await component.get('#user-edit-password-confirm').setValue(!mismatch
      ? (!tooShort ? 'testPasswordY' : 'y')
      : (!tooShort ? 'testPasswordZ' : 'z'));
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
    const component = mount(UserEditPassword, mountOptions({
      container: {
        requestData: { user }
      }
    }));
    component.find('form').exists().should.be.false();
  });

  describe('new passwords do not match', () => {
    it('shows a danger alert', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { mismatch: true });
      component.should.alert('danger', 'Please check that your new passwords match.');
    });

    it('marks the inputs as invalid', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { mismatch: true });
      const formGroups = component.findAllComponents(FormGroup);
      formGroups.length.should.equal(3);
      formGroups[1].props().hasError.should.be.true();
      formGroups[2].props().hasError.should.be.true();
    });

    it('marks the inputs as valid after the passwords match', () =>
      mockHttp()
        .mount(UserEditPassword, mountOptions())
        .request(async (component) => {
          await submit(component, { mismatch: true });
          await component.get('#user-edit-password-confirm').setValue('testPasswordY');
          return component.get('form').trigger('submit');
        })
        .beforeAnyResponse(component => {
          const formGroups = component.findAllComponents(FormGroup);
          formGroups.length.should.equal(3);
          formGroups[1].props().hasError.should.be.false();
          formGroups[2].props().hasError.should.be.false();
        })
        .respondWithSuccess());
  });

  describe('password is too short', () => {
    it('shows a danger alert', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { tooShort: true });
      component.should.alert('danger', 'Please input a password at least 10 characters long.');
    });

    it('marks the input as invalid', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { tooShort: true });
      const formGroups = component.findAllComponents(FormGroup);
      formGroups.length.should.equal(3);
      formGroups[1].props().hasError.should.be.true();
    });

    it('marks the input as valid after the password is long enough', () =>
      mockHttp()
        .mount(UserEditPassword, mountOptions())
        .request(async (component) => {
          await submit(component, { tooShort: true });
          await component.get('#user-edit-password-new-password').setValue('testPasswordY');
          await component.get('#user-edit-password-confirm').setValue('testPasswordY');
          return component.get('form').trigger('submit');
        })
        .beforeAnyResponse(component => {
          const formGroups = component.findAllComponents(FormGroup);
          formGroups.length.should.equal(3);
          formGroups[1].props().hasError.should.be.false();
        })
        .respondWithSuccess());
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(submit)
      .respondWithSuccess()
      .testRequests([{
        method: 'PUT',
        url: '/v1/users/1/password',
        data: { old: 'testPasswordX', new: 'testPasswordY' }
      }]));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: submit
      }));

  it('shows a success alert after a successful response', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(submit)
      .respondWithSuccess()
      .afterResponse(component => {
        component.should.alert('success');
      }));
});
