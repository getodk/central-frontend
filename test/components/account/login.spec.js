import sinon from 'sinon';
import { NavigationFailureType, isNavigationFailure } from 'vue-router';

import AccountLogin from '../../../src/components/account/login.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const submit = async (component) => {
  const form = component.get('#account-login form');
  await form.get('input[type="email"]').setValue('test@email.com');
  await form.get('input[type="password"]').setValue('foo');
  return form.trigger('submit');
};
const oidcContainer = {
  config: { oidcEnabled: true }
};

describe('AccountLogin', () => {
  it('focuses the first input', () => {
    const component = mount(AccountLogin, {
      container: { router: mockRouter('/account/login') },
      attachTo: document.body
    });
    component.get('input[type="email"]').should.be.focused();
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(AccountLogin, {
        container: { router: mockRouter('/account/login') }
      })
      .request(submit)
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/sessions');
        data.should.eql({ email: 'test@email.com', password: 'foo' });
      })
      .respondWithProblem());

  it('implements some standard button things', () =>
    // Using load() because of the custom <router-link>
    load('/login')
      .restoreSession(false)
      .complete()
      .testStandardButton({
        button: '#account-login .btn-primary',
        request: submit,
        disabled: ['#account-login .btn-link']
      }));

  it('shows a danger alert for incorrect credentials', () =>
    mockHttp()
      .mount(AccountLogin, {
        container: { router: mockRouter('/account/login') }
      })
      .request(submit)
      .respondWithProblem(401.2)
      .afterResponse(component => {
        component.should.alert('danger', 'Incorrect email address and/or password.');
      }));

  it('logs in', () => {
    // Specifying 'none' so that the request for the analytics config is not
    // sent.
    testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
    return load('/login')
      .restoreSession(false)
      .complete()
      .request(submit)
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.first())
      .respondFor('/', { users: false })
      .afterResponses(app => {
        const { requestData } = app.vm.$container;
        requestData.session.dataExists.should.be.true;
        requestData.currentUser.dataExists.should.be.true;
      });
  });

  it('aborts navigation during login', () => {
    testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
    return load('/login')
      .restoreSession(false)
      .complete()
      .request(submit)
      .beforeEachResponse(async (app, _, i) => {
        if (i < 2) {
          const result = await app.vm.$router.push('/not-found');
          isNavigationFailure(result, NavigationFailureType.aborted).should.be.true;
        }
      })
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.first())
      .respondFor('/', { users: false });
  });

  it('shows an info alert if the password is too short', () => {
    testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
    return load('/login')
      .restoreSession(false)
      .complete()
      .request(submit)
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.first())
      .respondFor('/', { users: false })
      .afterResponses(app => {
        app.should.alert('info', (message) => {
          message.should.endWith('make sure your password is 10 characters or longer.');
        });
      });
  });

  describe('next query param', () => {
    const navigateToNext = (next) => {
      const internal = sinon.fake();
      const external = sinon.fake();
      AccountLogin.methods.navigateToNext(next, internal, external);
      return { internal, external };
    };

    it('uses the param to redirect the user', () => {
      navigateToNext('/users').internal.calledWith('/users').should.be.true;
    });

    it('passes through query params and hash', () => {
      const { internal } = navigateToNext('/users?x=y#z');
      internal.calledWith('/users?x=y#z').should.be.true;
    });

    it('allows the param to be an absolute URL', () => {
      const { internal } = navigateToNext(`${window.location.origin}/users`);
      internal.calledWith('/users').should.be.true;
    });

    it('redirects the user to Enketo', () => {
      const { external } = navigateToNext('/-/abc');
      external.calledWith(`${window.location.origin}/-/abc`).should.be.true;
    });

    it('passes query params and hash to Enketo', () => {
      const { external } = navigateToNext('/-/abc?x=y#z');
      external.calledWith(`${window.location.origin}/-/abc?x=y#z`).should.be.true;
    });

    it('redirects the user to / if there is no param', () => {
      navigateToNext(undefined).internal.calledWith('/').should.be.true;
    });

    it('redirects the user to / if there are multiple params', () => {
      const { internal } = navigateToNext(['/users', '/account/edit']);
      internal.calledWith('/').should.be.true;
    });

    it('redirects the user to / if the param is /login', () => {
      navigateToNext('/login').internal.calledWith('/').should.be.true;

      const { internal } = navigateToNext('/login?next=%2Fusers');
      internal.calledWith('/').should.be.true;
    });

    it('does not redirect the user away from Central', () => {
      const { internal, external } = navigateToNext('https://www.google.com/');
      internal.calledWith('/').should.be.true;
      external.called.should.be.false;
    });

    it('uses the param after the user submits the form', () => {
      testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
      return load('/login?next=%2Faccount%2Fedit')
        .restoreSession(false)
        .complete()
        .request(submit)
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .respondFor('/account/edit')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/account/edit');
        });
    });

    it('does not redirect user to a route to which they do not have access', () => {
      testData.extendedUsers.createPast(1, {
        email: 'test@email.com',
        role: 'none'
      });
      return load('/login?next=%2Fusers')
        .restoreSession(false)
        .complete()
        .request(submit)
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .respondFor('/', { users: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it("does not use the param if the user's session is restored", () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      return load('/login?next=%2Faccount%2Fedit')
        .restoreSession()
        .respondFor('/', { users: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('does not use the param if a logged in user navigates to /login', () => {
      mockLogin();
      return load('/account/edit')
        .complete()
        .route('/login?next=%2Fusers')
        .respondFor('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('does not update Frontend before an external redirect', () => {
      testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
      return load('/login?next=%2F-%2Fxyz')
        .restoreSession(false)
        .complete()
        .request(app => {
          sinon.replace(
            app.getComponent(AccountLogin).vm,
            'navigateToNext',
            sinon.fake()
          );
          return submit(app);
        })
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponses(app => {
          app.find('#navbar-links').exists().should.be.false;
          app.get('#navbar-actions a').text().should.equal('Not logged in');
          app.get('#account-login .btn-primary').attributes('aria-disabled').should.equal('true');
          app.get('#account-login .btn-link').attributes('aria-disabled').should.equal('true');
        });
    });
  });

  describe('source=claim query param', () => {
    it('shows the mailing list opt-in checkbox and is checked by default', () =>
      load('/login?source=claim')
        .restoreSession(false)
        .complete()
        .request(app => app.find('#mailing-list-opt-in').get('input[type="checkbox"]').element.checked.should.be.true));

    it('does not show the checkbox if query parameter is not included', () =>
      load('/login?source=other')
        .restoreSession(false)
        .complete()
        .request(app => app.find('#mailing-list-opt-in').exists().should.be.false));

    it('sends a request to opt-in to the mailing list', () => {
      testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
      return load('/login?source=claim')
        .restoreSession(false)
        .complete()
        .request(submit) // checkbox is checked by default
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .respondWithSuccess()
        .respondFor('/', { users: false })
        .testRequestsInclude([
          { url: '/v1/user-preferences/site/mailingListOptIn', method: 'PUT', data: { propertyValue: true } },
        ]);
    });

    it('sends a request to opt-out of the mailing list', () => {
      testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
      return load('/login?source=claim')
        .restoreSession(false)
        .complete()
        .request(async (app) => {
          await app.find('#mailing-list-opt-in').get('input[type="checkbox"]').setValue(false);
          return submit(app);
        })
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .respondWithSuccess()
        .respondFor('/', { users: false })
        .testRequestsInclude([
          { url: '/v1/user-preferences/site/mailingListOptIn', method: 'PUT', data: { propertyValue: false } },
        ]);
    });
  });

  describe('OIDC is enabled', () => {
    it('renders a link to OIDC login', async () => {
      const component = await load('/login', {
        container: oidcContainer,
        root: false
      });
      component.get('a').attributes('href').should.equal('/v1/oidc/login');
    });

    it('does not render the form', async () => {
      const component = await load('/login', {
        container: oidcContainer,
        root: false
      });
      component.find('form').exists().should.be.false;
    });

    it('disables the link after it is clicked', async () => {
      const component = await load('/login', {
        container: oidcContainer,
        root: false
      });
      const a = component.get('a');
      a.element.addEventListener('click', (event) => {
        event.preventDefault();
      });
      await a.trigger('click');
      a.classes('disabled').should.be.true;
    });

    it('aborts navigation after the link is clicked', async () => {
      const app = await load('/login', { container: oidcContainer })
        .restoreSession(false);
      const a = app.get('#account-login a');
      a.element.addEventListener('click', (event) => {
        event.preventDefault();
      });
      await a.trigger('click');
      const result = await app.vm.$router.push('/not-found');
      isNavigationFailure(result, NavigationFailureType.aborted).should.be.true;
    });
  });

  describe('next query parameter if OIDC is enabled', () => {
    it('appends ?next to the link', async () => {
      const component = await load('/login?next=%2Fusers', {
        container: oidcContainer,
        root: false
      });
      const href = component.get('a').attributes('href');
      href.should.equal('/v1/oidc/login?next=%2Fusers');
    });

    it('does not append ?next if it was specified twice', async () => {
      const component = await load('/login?next=%2Fusers&next=%2Faccount%2Fedit', {
        container: oidcContainer,
        root: false
      });
      component.get('a').attributes('href').should.equal('/v1/oidc/login');
    });

    it('does not append ?next if it has no value', async () => {
      const component = await load('/login?next', {
        container: oidcContainer,
        root: false
      });
      component.get('a').attributes('href').should.equal('/v1/oidc/login');
    });
  });

  describe('OIDC error', () => {
    const alerts = [
      ['oidcError=auth-ok-user-not-found', 'There is no Central account associated with your email address.'],
      ['oidcError=email-claim-not-provided', 'Central could not access the email address associated with your account.'],
      ['oidcError=email-not-verified', 'Your email address has not been verified by your login server.'],
      ['oidcError=internal-server-error', 'Something went wrong during login.']
    ];
    for (const [query, expectedMessage] of alerts) {
      it(`shows an alert for ?${query}`, async () => {
        const app = await load(`/login?${query}`, { container: oidcContainer })
          .restoreSession(false);
        app.should.alert('danger', (actualMessage) => {
          actualMessage.should.startWith(expectedMessage);
        });
      });
    }

    const noAlerts = [
      'oidcError=auth-ok-user-not-found&oidcError=email-claim-not-provided',
      'oidcError',
      'oidcError=.',
      'oidcError=unknown'
    ];
    for (const query of noAlerts) {
      it(`does not show an alert for ?${query}`, async () => {
        const app = await load(`/login?${query}`, { container: oidcContainer })
          .restoreSession(false);
        app.should.not.alert();
      });
    }

    it('removes the query parameter from the path', async () => {
      const app = await load('/login?oidcError=auth-ok-user-not-found&next=%2Fusers', {
        container: oidcContainer
      }).restoreSession(false);
      app.vm.$route.query.should.eql({ next: '/users' });
    });
  });

  describe('existing session', () => {
    const in5Min = () => (Date.now() + 300000).toString();

    it('shows an info alert if OIDC is not enabled', async () => {
      const component = await load('/login', { root: false });
      localStorage.setItem('sessionExpires', in5Min());
      await submit(component);
      component.should.alert('info', (message) => {
        message.should.startWith('A user is already logged in.');
      });
    });

    it('shows an info alert if OIDC is enabled', async () => {
      const component = await load('/login', {
        container: oidcContainer,
        root: false
      });
      localStorage.setItem('sessionExpires', in5Min());
      await component.get('a[href^="/v1/oidc/login"]').trigger('click');
      component.should.alert('info', (message) => {
        message.should.startWith('A user is already logged in.');
      });
    });

    it('does not redirect to OIDC login', async () => {
      const component = await load('/login', {
        container: oidcContainer,
        root: false
      });
      localStorage.setItem('sessionExpires', in5Min());
      const a = component.get('a[href^="/v1/oidc/login"]');
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      a.element.dispatchEvent(event).should.be.false;
    });

    it('shows a CTA to refresh', () => {
      const reload = sinon.fake();
      return load('/login', {
        container: { location: { reload } }
      })
        .restoreSession(false)
        .afterResponses(async (app) => {
          localStorage.setItem('sessionExpires', in5Min());
          await submit(app);
          app.should.alert();
          await app.get('.alert-cta').trigger('click');
          reload.called.should.be.true;
        });
    });
  });
});
