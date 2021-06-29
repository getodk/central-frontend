import AccountClaim from '../../../src/components/account/claim.vue';

import { loadAsync } from '../../../src/util/async-components';

import { load, mockHttp } from '../../util/http';
import { mount } from '../../util/lifecycle';
import { wait } from '../../util/util';

describe('AccountClaim', () => {
  it('shows proper page title', () =>
    load('/account/claim?token=foo')
      .then(() => document.title.should.equal('Set Password | ODK Central')));

  it('focuses the input', () => {
    const component = mount(AccountClaim, { attachTo: document.body });
    component.get('input').should.be.focused();
  });

  it('shows a alert for short password length error', async () => {
    const component = mount(AccountClaim);
    await component.get('input').setValue('x');
    await component.get('form').trigger('submit');
    component.should.alert('danger', 'Please input a password at least 10 characters long.');
  });

  it('shows full password strength', async () => {
    const component = mount(AccountClaim);
    await loadAsync('Password');
    await wait();
    await component.get('input').setValue('@1TestPassword1@');
    component.get('.Password__strength-meter--fill').attributes('data-score').should.equal('4');
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(AccountClaim, {
        mocks: { $route: '/account/claim?token=foo' }
      })
      .request(async (component) => {
        await component.get('input').setValue('testPassword');
        return component.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { method, url, headers, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/users/reset/verify');
        headers.Authorization.should.equal('Bearer foo');
        data.should.eql({ new: 'testPassword' });
      })
      .respondWithProblem());

  it('implements some standard button things', () =>
    mockHttp()
      .mount(AccountClaim, {
        mocks: { $route: '/account/claim?token=foo' }
      })
      .testStandardButton({
        button: '.btn-primary',
        request: async (component) => {
          await component.get('input').setValue('testPassword');
          return component.get('form').trigger('submit');
        }
      }));

  it('shows a custom alert message for a 401.2 Problem', () =>
    mockHttp()
      .mount(AccountClaim, {
        mocks: { $route: '/account/claim?token=foo' }
      })
      .request(async (component) => {
        await component.get('input').setValue('testPassword');
        return component.get('form').trigger('submit');
      })
      .respondWithProblem({ code: 401.2, message: 'AccountClaim problem.' })
      .afterResponse(component => {
        component.should.alert('danger', (message) => {
          message.should.startWith('AccountClaim problem. The link in your email may have expired,');
        });
      }));

  describe('after a successful response', () => {
    const submit = () => load('/account/claim?token=foo')
      .request(async (app) => {
        const component = app.getComponent(AccountClaim);
        await component.get('input').setValue('testPassword');
        return component.get('form').trigger('submit');
      })
      .respondWithSuccess();

    it('redirects to login', async () => {
      const app = await submit();
      app.vm.$route.path.should.equal('/login');
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });
  });
});
