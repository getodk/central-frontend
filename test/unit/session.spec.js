import sinon from 'sinon';

import { logIn, logOut, restoreSession, useSessions } from '../../src/util/session';
import { noop } from '../../src/util/util';

import createTestContainer from '../util/container';
import testData from '../data';
import { load, mockHttp } from '../util/http';
import { mockLogin } from '../util/session';
import { mockRouter } from '../util/router';
import { setRequestData } from '../util/request-data';
import { withSetup } from '../util/lifecycle';

describe('util/session', () => {
  describe('session restore', () => {
    describe('session is not expired', () => {
      beforeEach(() => {
        const millis = Date.now() + 300000;
        testData.sessions.createPast(1, {
          expiresAt: new Date(millis).toISOString()
        });
        localStorage.setItem('sessionExpires', millis.toString());
      });

      it('sends the correct request', () => {
        const container = createTestContainer();
        const { session } = container.requestData;
        return mockHttp(container)
          .request(() => restoreSession(session))
          .beforeEachResponse((_, { method, url }) => {
            method.should.equal('GET');
            url.should.equal('/v1/sessions/restore');
          })
          .respondWithData(() => testData.sessions.last());
      });

      it('saves the session', () => {
        const container = createTestContainer();
        const { session } = container.requestData;
        return mockHttp(container)
          .request(() => restoreSession(session))
          .respondWithData(() => testData.sessions.last())
          .afterResponse(() => {
            session.dataExists.should.be.true();
          });
      });

      it('does not set sessionExpires in local storage', () => {
        const container = createTestContainer();
        const { session } = container.requestData;
        const setItem = sinon.fake();
        sinon.replace(Storage.prototype, 'setItem', setItem);
        return mockHttp(container)
          .request(() => restoreSession(session))
          .respondWithData(() => testData.sessions.last())
          .afterResponse(() => {
            setItem.called.should.be.false();
          });
      });

      it('removes sessionExpires from local storage after a 404', () => {
        const container = createTestContainer();
        const { session } = container.requestData;
        return mockHttp(container)
          .request(() => restoreSession(session).catch(noop))
          .respondWithProblem(404.1)
          .afterResponse(() => {
            should.not.exist(localStorage.getItem('sessionExpires'));
          });
      });
    });

    describe('session is expired', () => {
      beforeEach(() => {
        localStorage.setItem('sessionExpires', '0');
      });

      it('does not send a request', () => {
        const container = createTestContainer();
        const { session } = container.requestData;
        return mockHttp(container)
          .testNoRequest(() => restoreSession(session).catch(noop));
      });

      it('returns a rejected promise', () => {
        const { requestData } = createTestContainer();
        return restoreSession(requestData.session).should.be.rejected();
      });
    });

    it('sends a request if sessionExpires is not in local storage', () => {
      testData.sessions.createPast(1);
      const container = createTestContainer();
      const { session } = container.requestData;
      return mockHttp(container)
        .request(() => restoreSession(session))
        .respondWithData(() => testData.sessions.last());
    });
  });

  describe('login', () => {
    describe('request for the current user', () => {
      beforeEach(() => {
        // Specifying 'none' so that the request for the analytics config is not
        // sent.
        testData.extendedUsers.createPast(1, { role: 'none' });
      });

      it('sends the correct request', () => {
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew({ token: 'foo' }) }
        });
        return mockHttp(container)
          .request(() => logIn(container, true))
          .beforeEachResponse((_, { method, url, headers }) => {
            method.should.equal('GET');
            url.should.equal('/v1/users/current');
            headers.Authorization.should.equal('Bearer foo');
            headers['X-Extended-Metadata'].should.equal('true');
          })
          .respondWithData(() => testData.extendedUsers.first());
      });

      it('saves currentUser', () => {
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        const { currentUser } = container.requestData;
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .afterResponse(() => {
            currentUser.dataExists.should.be.true();
          });
      });

      it('returns a promise', () => {
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        return mockHttp(container)
          .request(() => logIn(container, true).should.be.fulfilled())
          .respondWithData(() => testData.extendedUsers.first());
      });
    });

    describe('newSession', () => {
      it('sets local storage if newSession is true', () => {
        sinon.useFakeTimers();
        testData.extendedUsers.createPast(1, { role: 'none' });
        const container = createTestContainer({
          router: mockRouter(),
          requestData: {
            session: testData.sessions.createNew({ expiresAt: '1970-01-02T00:00:00Z' })
          }
        });
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .afterResponse(() => {
            localStorage.getItem('sessionExpires').should.equal('86400000');
          });
      });

      it('does not set local storage if newSession is false', () => {
        testData.extendedUsers.createPast(1, { role: 'none' });
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        return mockHttp(container)
          .request(() => logIn(container, false))
          .respondWithData(() => testData.extendedUsers.first())
          .afterResponse(() => {
            should.not.exist(localStorage.getItem('sessionExpires'));
          });
      });
    });

    describe('request for the analytics config', () => {
      it('sends the request if the user can config.read', () => {
        testData.extendedUsers.createPast(1, { role: 'admin' });
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew({ token: 'foo' }) }
        });
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .respondWithProblem(404.1)
          .testRequests([
            null,
            {
              url: '/v1/config/analytics',
              headers: { Authorization: 'Bearer foo' }
            }
          ]);
      });

      it('does not send request if showsAnalytics config is false', () => {
        testData.extendedUsers.createPast(1, { role: 'admin' });
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew({ token: 'foo' }) },
          config: { showsAnalytics: false }
        });
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .testRequests([
            {
              url: '/v1/users/current',
              headers: { Authorization: 'Bearer foo' },
              extended: true
            }
          ]);
      });
    });
  });

  describe('logout', () => {
    it('sends the correct request', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({
        router: mockRouter(),
        requestData: { session: testData.sessions.createNew({ token: 'foo' }) }
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(container, false))
        .beforeEachResponse((_, { method, url, headers }) => {
          method.should.equal('DELETE');
          url.should.equal('/v1/sessions/foo');
          headers.Authorization.should.equal('Bearer foo');
        })
        .respondWithSuccess();
    });

    it('returns a promise', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({
        router: mockRouter(),
        requestData: { session: testData.sessions.createNew() }
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(container, false).should.be.fulfilled())
        .respondWithSuccess();
    });

    it('clears requestData', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({
        router: mockRouter(),
        requestData: { session: testData.sessions.createNew() }
      });
      const { requestData } = container;
      const { session, currentUser, roles } = requestData;
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          // Set data that is not cleared after a route change.
          setRequestData(requestData, {
            roles: testData.standardRoles.sorted()
          });
        })
        .request(() => logOut(container, false))
        .respondWithSuccess()
        .afterResponse(() => {
          session.dataExists.should.be.false();
          currentUser.dataExists.should.be.false();
          roles.dataExists.should.be.false();
        });
    });

    describe('canceling requests', () => {
      it('cancels the request for the analytics config', () => {
        testData.extendedUsers.createPast(1);
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        const { analyticsConfig } = container.requestData;
        return mockHttp(container)
          .request(() => logIn(container, true))
          .beforeEachResponse((_, { url }) => {
            if (url === '/v1/config/analytics') {
              sinon.spy(analyticsConfig, 'cancelRequest');
              logOut(container, false);
              analyticsConfig.cancelRequest.called.should.be.true();
            }
          })
          .respondWithData(() => testData.extendedUsers.first())
          .respondWithProblem(404.1)
          .respondWithSuccess();
      });

      it('cancels a request for the roles', () => {
        testData.extendedUsers.createPast(1, { role: 'none' });
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        const { roles } = container.requestData;
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          // Send a request that would not be canceled by a route change.
          .request(() => roles.request({ url: '/v1/roles' }).catch(noop))
          .beforeEachResponse((_, { url }) => {
            if (url === '/v1/roles') {
              sinon.spy(roles, 'cancelRequest');
              logOut(container, false);
              roles.cancelRequest.called.should.be.true();
            }
          })
          .respondWithData(() => testData.standardRoles.sorted())
          .respondWithSuccess();
      });
    });

    it('removes sessionExpires from local storage', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({
        router: mockRouter(),
        requestData: { session: testData.sessions.createNew() }
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(container, false))
        .respondWithSuccess()
        .afterResponse(() => {
          should.not.exist(localStorage.getItem('sessionExpires'));
        });
    });

    describe('route', () => {
      beforeEach(mockLogin);

      it('navigates to /login', () =>
        load('/users')
          .complete()
          .request(app => logOut(app.vm.$container, false))
          .respondWithSuccess()
          .afterResponse(app => {
            app.vm.$route.fullPath.should.equal('/login');
          }));

      // Response data is cleared differently depending on whether the user is
      // logged out during the initial navigation or after it.
      it('clears requestData', () =>
        load('/users')
          .complete()
          .request(app => logOut(app.vm.$container, false))
          .respondWithSuccess()
          .afterResponse(app => {
            const { requestData } = app.vm.$container;
            requestData.session.dataExists.should.be.false();
            requestData.currentUser.dataExists.should.be.false();
            requestData.roles.dataExists.should.be.false();
          }));

      it('sets the ?next query parameter if setNext is true', () =>
        load('/users?foo=bar#baz')
          .complete()
          .request(app => logOut(app.vm.$container, true))
          .respondWithSuccess()
          .afterResponse(app => {
            const route = app.vm.$route;
            route.path.should.equal('/login');
            route.query.next.should.equal('/users?foo=bar#baz');
          }));

      it('ignores unsaved changes', () => {
        const confirm = sinon.fake();
        sinon.replace(window, 'confirm', confirm);
        return load('/users')
          .afterResponses(app => {
            app.vm.$container.unsavedChanges.plus(1);
          })
          .request(app => logOut(app.vm.$container, false))
          .respondWithSuccess()
          .afterResponse(app => {
            app.vm.$route.path.should.equal('/login');
            app.vm.$container.unsavedChanges.count.should.equal(0);
            confirm.called.should.be.false();
          });
      });
    });

    describe('request results in an error', () => {
      beforeEach(() => {
        testData.extendedUsers.createPast(1, { role: 'none' });
      });

      it('returns a rejected promise', () => {
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(container, false).should.be.rejected())
          .respondWithProblem();
      });

      it('shows a danger alert', () => {
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        const { alert } = container;
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(container, false).catch(noop))
          .respondWithProblem({
            code: 500.1,
            message: 'logOut() problem.'
          })
          .afterResponse(() => {
            alert.state.should.be.true();
            alert.type.should.equal('danger');
            alert.message.should.startWith('There was a problem, and you were not fully logged out.');
            alert.message.should.endWith('logOut() problem.');
          });
      });

      it('returns a fulfilled promise for a 401.2 Problem', () => {
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(container, false).should.be.fulfilled())
          .respondWithProblem(401.2);
      });

      it('returns a fulfilled promise for a 403.1 Problem', () => {
        const container = createTestContainer({
          router: mockRouter(),
          requestData: { session: testData.sessions.createNew() }
        });
        return mockHttp(container)
          .request(() => logIn(container, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(container, false).should.be.fulfilled())
          .respondWithProblem(403.1);
      });
    });

    describe('logout during the request for the current user', () => {
      describe('initial navigation', () => {
        beforeEach(() => {
          testData.extendedUsers.createPast(1);
        });

        it('cancels the request for the current user', () =>
          load('/users', {}, false)
            .beforeEachResponse((app, { url }) => {
              if (url === '/v1/users/current') {
                const container = app.vm.$container;
                const { currentUser } = container.requestData;
                sinon.spy(currentUser, 'cancelRequest');
                logOut(container, false).catch(noop);
                currentUser.cancelRequest.called.should.be.true();
              }
            })
            .restoreSession()
            .respondWithProblem(401.2));

        it('does not navigate to /login', () => {
          const replace = sinon.fake();
          return load('/reset-password')
            .beforeEachResponse((app, { url }) => {
              if (url === '/v1/users/current') {
                sinon.replace(app.vm.$router, 'replace', replace);
                logOut(app.vm.$container, false).catch(noop);
              }
            })
            .restoreSession()
            .respondWithProblem(401.2)
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/reset-password');
              replace.called.should.be.false();
            });
        });
      });

      describe('after the login form is submitted', () => {
        beforeEach(() => {
          testData.extendedUsers.createPast(1, { email: 'alice@getodk.org' });
        });

        it('cancels the request for the current user', () =>
          load('/login')
            .restoreSession(false)
            .complete()
            .request(async (app) => {
              const form = app.get('#account-login form');
              await form.get('input[type="email"]').setValue('alice@getodk.org');
              await form.get('input[type="password"]').setValue('foo');
              return form.trigger('submit');
            })
            .beforeEachResponse((app, { url }) => {
              if (url === '/v1/users/current') {
                const container = app.vm.$container;
                const { currentUser } = container.requestData;
                sinon.spy(currentUser, 'cancelRequest');
                logOut(container, false).catch(noop);
                currentUser.cancelRequest.called.should.be.true();
              }
            })
            .respondWithData(() => testData.sessions.createNew())
            .respondWithData(() => testData.extendedUsers.first())
            .respondWithProblem(401.2));

        it('does not change the route', () =>
          load('/login?next=%2Fusers')
            .restoreSession(false)
            .complete()
            .request(async (app) => {
              const form = app.get('#account-login form');
              await form.get('input[type="email"]').setValue('alice@getodk.org');
              await form.get('input[type="password"]').setValue('foo');
              return form.trigger('submit');
            })
            .beforeEachResponse((app, { url }) => {
              if (url === '/v1/users/current')
                logOut(app.vm.$container, false).catch(noop);
            })
            .respondWithData(() => testData.sessions.createNew())
            .respondWithData(() => testData.extendedUsers.first())
            .respondWithProblem(401.2)
            .afterResponses(app => {
              app.vm.$route.fullPath.should.equal('/login?next=%2Fusers');
            }));
      });
    });
  });

  describe('request for the current user results in an error', () => {
    it('logs out', () => {
      const container = createTestContainer({
        router: mockRouter(),
        requestData: { session: testData.sessions.createNew() }
      });
      const { session } = container.requestData;
      return mockHttp(container)
        .request(() => logIn(container, true).catch(noop))
        .respondWithProblem()
        .respondWithSuccess()
        .afterResponses(() => {
          session.dataExists.should.be.false();
        });
    });

    it('returns a rejected promise', () => {
      const container = createTestContainer({
        router: mockRouter(),
        requestData: { session: testData.sessions.createNew() }
      });
      return mockHttp(container)
        .request(() => logIn(container, true).should.be.rejected())
        .respondWithProblem()
        .respondWithSuccess();
    });
  });

  describe('logout before session expiration', () => {
    it('logs out a minute before the session expires', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      const { session } = setRequestData(container.requestData, {
        session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .testNoRequest(() => {
          clock.tick(239000);
        })
        .request(() => {
          clock.tick(1000);
        })
        .respondWithSuccess()
        .afterResponse(() => {
          session.dataExists.should.be.false();
        });
    });

    it('sets the ?next query parameter', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      testData.sessions.createPast(1, { expiresAt: '1970-01-01T00:05:00Z' });
      return load('/', {}, false)
        .restoreSession()
        .respondFor('/', { users: false })
        .complete()
        .request(() => {
          clock.tick(15000);
        })
        .respond(() => ({ status: 404, data: '' })) // /version.txt
        .complete()
        .request(() => {
          clock.tick(225000);
        })
        .respondWithSuccess()
        .afterResponse(app => {
          app.vm.$route.query.next.should.equal('/');
        });
    });

    it('shows an alert after the logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      const { requestData, alert } = container;
      setRequestData(requestData, {
        session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => {
          clock.tick(240000);
        })
        .respondWithSuccess()
        .afterResponse(() => {
          alert.state.should.be.true();
          alert.type.should.equal('info');
          alert.message.should.startWith('Your session has expired.');
        });
    });

    it('does not attempt to log out if there was already a logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      setRequestData(container.requestData, {
        session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(container, false))
        .respondWithSuccess()
        .complete()
        .testNoRequest(() => {
          clock.tick(240000);
        });
    });
  });

  describe('logout after session expiration', () => {
    it('does not send a request', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({
        router: mockRouter(),
        requestData: {
          session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
        }
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .testNoRequest(() => {
          clock.tick(300000);
          return logOut(container, false);
        });
    });

    it('returns a fulfilled promise', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({
        router: mockRouter(),
        requestData: {
          session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
        }
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(300000);
          return logOut(container, false).should.be.fulfilled();
        });
    });
  });

  describe('session expiration warning', () => {
    it('shows an alert 2 minutes before logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      const { requestData, alert } = container;
      setRequestData(requestData, {
        session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(119000);
          alert.state.should.be.false();
          clock.tick(1000);
          alert.state.should.be.true();
          alert.type.should.equal('info');
          alert.message.should.startWith('Your session will expire in 2 minutes,');
        });
    });

    it('does not show the alert more than once for the same session', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      const { requestData, alert } = container;
      setRequestData(requestData, {
        session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(120000);
          alert.state.should.be.true();
          alert.blank();
          clock.tick(30000);
          alert.state.should.be.false();
        })
        .request(() => logOut(container, false))
        .respondWithSuccess()
        .complete()
        .request(() => {
          setRequestData(requestData, {
            session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:07:30Z' })
          });
          return logIn(container, true);
        })
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(120000);
          alert.state.should.be.true();
        });
    });

    it('does not show the alert if there was already a logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      const { requestData, alert } = container;
      setRequestData(requestData, {
        session: testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' })
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(container, false))
        .respondWithSuccess()
        .afterResponse(() => {
          alert.blank();
          clock.tick(120000);
          alert.state.should.be.false();
        });
    });
  });

  describe('local storage changes', () => {
    it('logs out after sessionExpires changes', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      const { session } = setRequestData(container.requestData, {
        session: testData.sessions.createNew()
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'sessionExpires',
            url: window.location.href
          }));
        })
        .respondWithProblem(401.2)
        .afterResponse(() => {
          session.dataExists.should.be.false();
        });
    });

    it('logs out after local storage is cleared', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      const { session } = setRequestData(container.requestData, {
        session: testData.sessions.createNew()
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: null,
            url: window.location.href
          }));
        })
        .respondWithSuccess()
        .afterResponse(() => {
          session.dataExists.should.be.false();
        });
    });

    it('sets the ?next query parameter', () => {
      mockLogin();
      return load('/users')
        .complete()
        .request(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'sessionExpires',
            url: window.location.href
          }));
        })
        .respondWithProblem(401.2)
        .afterResponse(app => {
          app.vm.$route.query.next.should.equal('/users');
        });
    });

    it('does not attempt to log out if there was already a logout', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      setRequestData(container.requestData, {
        session: testData.sessions.createNew()
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(container, false))
        .respondWithSuccess()
        .complete()
        .testNoRequest(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'sessionExpires',
            url: window.location.href
          }));
        });
    });

    it('does not log out after a different item in local storage changes', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      const container = createTestContainer({ router: mockRouter() });
      withSetup(useSessions, { container });
      setRequestData(container.requestData, {
        session: testData.sessions.createNew()
      });
      return mockHttp(container)
        .request(() => logIn(container, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .testNoRequest(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'foo',
            url: window.location.href
          }));
        });
    });
  });
});
