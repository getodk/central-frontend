import UserEditBasicDetails from '../../../../src/components/user/edit/basic-details.vue';

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

describe('UserEditBasicDetails', () => {
  it('sets the value of the email input to the current email', () => {
    mockLogin({ email: 'old@email.com' });
    const component = mount(UserEditBasicDetails, mountOptions());
    const { value } = component.get('input[type="email"]').element;
    value.should.equal('old@email.com');
  });

  it('sets value of display name input to current display name', () => {
    mockLogin({ displayName: 'Old Name' });
    const component = mount(UserEditBasicDetails, mountOptions());
    component.get('input[type="text"]').element.value.should.equal('Old Name');
  });

  it('resets the form if the route changes', () => {
    mockLogin({ displayName: 'Old Name', email: 'old@email.com' });
    testData.extendedUsers.createPast(1, {
      email: 'another@email.com',
      displayName: 'Another Name'
    });
    return load('/users/1/edit', {}, {
      user: () => testData.standardUsers.first()
    })
      .afterResponses(async (app) => {
        const component = app.getComponent(UserEditBasicDetails);
        await component.get('input[type="email"]').setValue('new@email.com');
        return component.get('input[type="text"]').setValue('New Name');
      })
      .load('/users/2/edit')
      .afterResponses(app => {
        const component = app.getComponent(UserEditBasicDetails);
        const email = component.get('input[type="email"]');
        email.element.value.should.equal('another@email.com');
        component.get('input[type="text"]').element.value.should.equal('Another Name');
      });
  });

  it('disables email input for a user without a sitewide role if OIDC is enabled', async () => {
    mockLogin({ role: 'none' });
    const component = mount(UserEditBasicDetails, mountOptions({
      container: {
        config: { oidcEnabled: true }
      }
    }));
    const input = component.get('input[type="email"]');
    input.attributes('aria-disabled').should.equal('true');
    input.should.have.ariaDescription(/^Your email address cannot be changed/);
    await input.should.have.tooltip(/^Your email address cannot be changed/);
  });

  it('sends the correct request', () => {
    mockLogin({ displayName: 'Old Name', email: 'old@email.com' });
    return mockHttp()
      .mount(UserEditBasicDetails, mountOptions())
      .request(async (component) => {
        await component.get('input[type="email"]').setValue('new@email.com');
        await component.get('input[type="text"]').setValue('New Name');
        return component.get('form').trigger('submit');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'PATCH',
        url: '/v1/users/1',
        data: { email: 'new@email.com', displayName: 'New Name' }
      }]);
  });

  it('implements some standard button things', () => {
    mockLogin({ email: 'old@email.com' });
    return mockHttp()
      .mount(UserEditBasicDetails, mountOptions())
      .testStandardButton({
        button: 'button',
        request: async (component) => {
          await component.get('input[type="email"]').setValue('new@email.com');
          return component.get('form').trigger('submit');
        }
      });
  });

  describe('custom alert messages', () => {
    beforeEach(() => {
      mockLogin({ email: 'old@email.com' });
    });

    it('shows a custom message for a duplicate email', () =>
      mockHttp()
        .mount(UserEditBasicDetails, mountOptions())
        .request(async (component) => {
          await component.get('input[type="email"]').setValue('new@email.com');
          return component.get('form').trigger('submit');
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
            message.should.startWith('You cannot change your email to new@email.com');
          });
        }));

    // I don't think a different uniqueness violation is currently possible.
    // This is mostly about future-proofing.
    it('shows the default message for a different uniqueness violation', () =>
      mockHttp()
        .mount(UserEditBasicDetails, mountOptions())
        .request(async (component) => {
          await component.get('input[type="email"]').setValue('new@email.com');
          return component.get('form').trigger('submit');
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
    beforeEach(() => {
      mockLogin({ displayName: 'Old Name' });
    });

    const submit = () => load('/account/edit')
      .complete()
      .request(async (app) => {
        const component = app.getComponent(UserEditBasicDetails);
        await component.get('input[type="text"]').setValue('New Name');
        return component.get('form').trigger('submit');
      })
      .respondWithData(() => {
        testData.extendedUsers.update(-1, { displayName: 'New Name' });
        return testData.standardUsers.last();
      });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });

    it("updates the user's display name", async () => {
      const app = await submit();
      app.get('#navbar-actions a').text().should.equal('New Name');
      app.get('#page-head-title').text().should.equal('New Name');
    });
  });
});
