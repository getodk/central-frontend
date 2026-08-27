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
const haveIbeenPwnedRequest = password => {
  const hashPrefix = (() => {
    switch (password) {
      case 'testPasswordY': return '036EA';
      default: throw new Error(`No haveibeenpwned API request defined for password '${password}'`);
    }
  })();

  return {
    method: 'GET',
    url: `https://api.pwnedpasswords.com/range/${hashPrefix}`,
  };
};
const haveIbeenPwnedResponse = password => {
  const hashes = (() => {
    switch (password) {
      case 'testPasswordY':
        return [
          '005E8325869AFF00C6E09BB59964923BE14:1',
          '009F3803299EF825B220707AE492B801B8C:9',
          '00E4600320A4F051A36B6087D2D1D4933E5:502',
          '01010F6D71D3277A8E9767BB7C695A3904E:3',
          '0113AE28B46F0D0ABCE49F128E2D218BA23:4',
        ];
      case 'pwnedPassword':
        return [
          '06B58FE7510B4A31E413F9A64A1C1A747C8:999999',
        ];
      default: throw new Error(`No haveibeenpwned API response defined for password '${password}'`);
    }
  })();

  return () => hashes.join('\r\n');
};

describe.only('UserEditPassword', () => {
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

  it('renders correctly if OIDC is enabled', () => {
    const component = mount(UserEditPassword, {
      container: {
        config: { oidcEnabled: true }
      }
    });
    component.find('form').exists().should.be.false;
    const text = component.get('p').text();
    text.should.equal('This Central server does not manage any login passwords.');
  });

  it("renders correctly if it is not the current user's own account", () => {
    const user = testData.standardUsers.createPast(1).last();
    const component = mount(UserEditPassword, mountOptions({
      container: {
        requestData: { user }
      }
    }));
    component.find('form').exists().should.be.false;
    const text = component.get('p').text();
    text.should.equal('Only the owner of the account may directly set their own password.');
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
      formGroups[1].props().hasError.should.be.true;
      formGroups[2].props().hasError.should.be.true;
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
          formGroups[1].props().hasError.should.be.false;
          formGroups[2].props().hasError.should.be.false;
        })
        .respondWithData(haveIbeenPwnedResponse('testPasswordY'))
        .respondWithSuccess());
  });

  describe('password is too short', () => {
    it('shows a danger alert', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { tooShort: true });
      component.should.alert('danger', 'Password must be at least 10 characters long.');
    });

    it('marks the input as invalid', async () => {
      const component = mount(UserEditPassword, mountOptions());
      await submit(component, { tooShort: true });
      const formGroups = component.findAllComponents(FormGroup);
      formGroups.length.should.equal(3);
      formGroups[1].props().hasError.should.be.true;
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
          formGroups[1].props().hasError.should.be.false;
        })
        .respondWithData(haveIbeenPwnedResponse('testPasswordY'))
        .respondWithSuccess());
  });

  it('should display an error if password included in breach', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(async (component) => {
        await submit(component, { tooShort: true });
        await component.get('#user-edit-password-new-password').setValue('pwnedPassword');
        await component.get('#user-edit-password-confirm').setValue('pwnedPassword');
        return component.get('form').trigger('submit');
      })
      .beforeAnyResponse(component => {
        const formGroups = component.findAllComponents(FormGroup);
        formGroups.length.should.equal(3);
        formGroups[1].props().hasError.should.be.false;
      })
      .respondWithData(haveIbeenPwnedResponse('pwnedPassword'))
      .afterResponses(app => {
        const formGroups = app.findAllComponents(FormGroup);
        formGroups.length.should.equal(3);
        const formGroup = formGroups[1];
        formGroup.props().hasError.should.be.true;
        formGroup.find('.collapsible-error').exists().should.be.true;
      }));

  it('should allow user to continue if password breach check returns 500', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(submit)
      .respond(() => ({ status: 500 }))
      .respondWithSuccess()
      .testRequests([
        haveIbeenPwnedRequest('testPasswordY'),
        {
          method: 'PUT',
          url: '/v1/users/1/password',
          data: { old: 'testPasswordX', new: 'testPasswordY' }
        },
      ]));

  it('should allow user to continue if password breach check times out', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(submit)
      .respondNever()
      .respondWithSuccess()
      .testRequests([
        haveIbeenPwnedRequest('testPasswordY'),
        {
          method: 'PUT',
          url: '/v1/users/1/password',
          data: { old: 'testPasswordX', new: 'testPasswordY' }
        },
      ]));

  it('sends the correct request', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(submit)
      .respondWithData(haveIbeenPwnedResponse('testPasswordY'))
      .respondWithSuccess()
      .testRequests([
        haveIbeenPwnedRequest('testPasswordY'),
        {
          method: 'PUT',
          url: '/v1/users/1/password',
          data: { old: 'testPasswordX', new: 'testPasswordY' }
        },
      ]));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .respondWithData(haveIbeenPwnedResponse('testPasswordY'))
      .testStandardButton({
        button: '.btn-primary',
        request: submit
      }));

  it('shows a success alert after a successful response', () =>
    mockHttp()
      .mount(UserEditPassword, mountOptions())
      .request(submit)
      .respondWithData(haveIbeenPwnedResponse('testPasswordY'))
      .respondWithSuccess()
      .afterResponse(component => {
        component.should.alert('success');
      }));
});
