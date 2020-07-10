import sinon from 'sinon';

import AccountLogin from '../../../src/components/account/login.vue';
import testData from '../../data';
import { load, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { submitForm } from '../../util/event';

describe('AccountLogin', () => {
  describe('routing', () => {
    it('does not redirect if user navigates to /account-edit, then session is restored', () =>
      mockRoute('/account/edit')
        .restoreSession(true)
        .respondWithData(() => testData.standardUsers.first())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/account/edit');
        }));
  });

  it('focuses the first input', () =>
    load('/login', { attachToDocument: true }, {})
      .restoreSession(false)
      .afterResponses(app => {
        app.first('#account-login input[type="email"]').should.be.focused();
      }));

  it('implements some standard button things', () =>
    load('/login')
      .restoreSession(false)
      .complete()
      .request(app => submitForm(app, '#account-login form', [
        ['input[type="email"]', 'test@email.com'],
        ['input[type="password"]', 'password']
      ]))
      .standardButton());

  it('shows a danger alert for incorrect credentials', () =>
    load('/login')
      .restoreSession(false)
      .complete()
      .request(app => submitForm(app, '#account-login form', [
        ['input[type="email"]', 'test@email.com'],
        ['input[type="password"]', 'password']
      ]))
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
      const { external } = navigateToNext('/enketo/abc');
      external.calledWith(`${window.location.origin}/enketo/abc`).should.be.true();
    });

    it('passes query params and hash to Enketo', () => {
      const { external } = navigateToNext('/enketo/abc?x=y#z');
      external.calledWith(`${window.location.origin}/enketo/abc?x=y#z`).should.be.true();
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
        .request(app => submitForm(app, '#account-login form', [
          ['input[type="email"]', 'test@email.com'],
          ['input[type="password"]', 'password']
        ]))
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
        .request(app => submitForm(app, '#account-login form', [
          ['input[type="email"]', 'test@email.com'],
          ['input[type="password"]', 'password']
        ]))
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first())
        .respondFor('/', { users: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it("does not use the param if the user's session is restored", () =>
      load('/login?next=%2Fusers')
        .restoreSession(true)
        .respondFor('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

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

    it('does not re-enable buttons before an external redirect', () => {
      testData.extendedUsers.createPast(1, { email: 'test@email.com' });
      return load('/login?next=%2Fenketo%2Fxyz')
        .restoreSession(false)
        .complete()
        .request(app => {
          const accountLogin = app.first(AccountLogin);
          sinon.replace(accountLogin.vm, 'navigateToNext', sinon.fake(() => {
            accountLogin.first('.btn-primary').should.be.disabled();
            accountLogin.first('.btn-link').should.be.disabled();
          }));
          return submitForm(accountLogin, 'form', [
            ['input[type="email"]', 'test@email.com'],
            ['input[type="password"]', 'password']
          ]);
        })
        .respondWithData(() => testData.sessions.createNew())
        .respondWithData(() => testData.extendedUsers.first());
    });
  });
});
