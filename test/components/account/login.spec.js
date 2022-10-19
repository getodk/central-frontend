import sinon from 'sinon';

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

describe('AccountLogin', () => {
  it('focuses the first input', () => {
    const component = mount(AccountLogin, {
      container: { router: mockRouter('/account/login') },
      attachTo: document.body
    });
    component.get('input[type="email"]').should.be.focused();
  });

  it('shows an info alert if there is an existing session', async () => {
    const component = mount(AccountLogin, {
      container: { router: mockRouter('/account/login') }
    });
    localStorage.setItem('sessionExpires', (Date.now() + 300000).toString());
    await submit(component);
    component.should.alert('info', (message) => {
      message.should.startWith('A user is already logged in.');
    });
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
        requestData.session.dataExists.should.be.true();
        requestData.currentUser.dataExists.should.be.true();
      });
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
          message.should.startWith('Your password is shorter than 10 characters.');
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
      navigateToNext('/users').internal.calledWith('/users').should.be.true();
    });

    it('passes through query params and hash', () => {
      const { internal } = navigateToNext('/users?x=y#z');
      internal.calledWith('/users?x=y#z').should.be.true();
    });

    it('allows the param to be an absolute URL', () => {
      const { internal } = navigateToNext(`${window.location.origin}/users`);
      internal.calledWith('/users').should.be.true();
    });

    it('redirects the user to Enketo', () => {
      const { external } = navigateToNext('/-/abc');
      external.calledWith(`${window.location.origin}/-/abc`).should.be.true();
    });

    it('passes query params and hash to Enketo', () => {
      const { external } = navigateToNext('/-/abc?x=y#z');
      external.calledWith(`${window.location.origin}/-/abc?x=y#z`).should.be.true();
    });

    it('redirects the user to / if there is no param', () => {
      navigateToNext(undefined).internal.calledWith('/').should.be.true();
    });

    it('redirects the user to / if there are multiple params', () => {
      const { internal } = navigateToNext(['/users', '/account/edit']);
      internal.calledWith('/').should.be.true();
    });

    it('redirects the user to / if the param is /login', () => {
      navigateToNext('/login').internal.calledWith('/').should.be.true();

      const { internal } = navigateToNext('/login?next=%2Fusers');
      internal.calledWith('/').should.be.true();
    });

    it('does not redirect the user away from Central', () => {
      const { internal, external } = navigateToNext('https://www.google.com/');
      internal.calledWith('/').should.be.true();
      external.called.should.be.false();
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
          app.find('#navbar-links').exists().should.be.false();
          app.get('#navbar-actions a').text().should.equal('Not logged in');
          app.get('#account-login .btn-primary').element.disabled.should.be.true();
          app.get('#account-login .btn-link').element.disabled.should.be.true();
        });
    });
  });
});
