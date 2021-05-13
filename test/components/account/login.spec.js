import sinon from 'sinon';

import AccountLogin from '../../../src/components/account/login.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

const submit = trigger.submit('#account-login form', [
  ['input[type="email"]', 'test@email.com'],
  ['input[type="password"]', 'foo']
]);

describe('AccountLogin', () => {
  it('focuses the first input', () =>
    load('/login', { attachToDocument: true }, {})
      .restoreSession(false)
      .afterResponses(app => {
        app.first('#account-login input[type="email"]').should.be.focused();
      }));

  it('sends the correct request', () =>
    load('/login')
      .restoreSession(false)
      .complete()
      .request(submit)
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/sessions');
        data.should.eql({ email: 'test@email.com', password: 'foo' });
      })
      .respondWithProblem());

  it('implements some standard button things', () =>
    load('/login')
      .restoreSession(false)
      .complete()
      .testStandardButton({
        button: '#account-login .btn-primary',
        request: submit,
        disabled: ['#account-login .btn-link']
      }));

  it('logs in', () => {
    testData.extendedUsers.createPast(1, { email: 'test@email.com' });
    return load('/login')
      .restoreSession(false)
      .complete()
      .request(submit)
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.first())
      .respondFor('/')
      .afterResponses(app => {
        const { data } = app.vm.$store.state.request;
        should.exist(data.session);
        should.exist(data.currentUser);
      });
  });

  it('sets local storage', () => {
    testData.extendedUsers.createPast(1, { email: 'test@email.com' });
    return load('/login')
      .restoreSession(false)
      .complete()
      .request(submit)
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.first())
      .respondFor('/')
      .afterResponses(() => {
        should.exist(localStorage.getItem('sessionExpires'));
      });
  });

  it('shows an alert if there is an existing session', () =>
    load('/login')
      .restoreSession(false)
      .afterResponses(app => {
        localStorage.setItem('sessionExpires', (Date.now() + 300000).toString());
        return submit(app);
      })
      .then(app => {
        app.should.alert('info', (message) => {
          message.should.startWith('A user is already logged in.');
        });
      }));

  it('shows a danger alert for incorrect credentials', () =>
    load('/login')
      .restoreSession(false)
      .complete()
      .request(submit)
      .respondWithProblem(401.2)
      .afterResponse(app => {
        app.should.alert('danger', 'Incorrect email address and/or password.');
      }));

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
      testData.extendedUsers.createPast(1, { email: 'test@email.com' });
      return load('/login?next=%2Fusers')
        .restoreSession(false)
        .complete()
        .request(submit)
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .respondFor('/users')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/users');
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
      testData.extendedUsers.createPast(1);
      return load('/login?next=%2Fusers')
        .restoreSession(true)
        .respondFor('/')
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
      testData.extendedUsers.createPast(1, { email: 'test@email.com' });
      return load('/login?next=%2F-%2Fxyz')
        .restoreSession(false)
        .complete()
        .request(app => {
          sinon.replace(
            app.first(AccountLogin).vm,
            'navigateToNext',
            sinon.fake()
          );
          return submit(app);
        })
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponses(app => {
          app.find('#navbar-links').length.should.equal(0);
          app.first('#navbar-actions a').text().trim().should.equal('Not logged in');
          app.first('#account-login .btn-primary').should.be.disabled();
          app.first('#account-login .btn-link').should.be.disabled();
        });
    });
  });
});
