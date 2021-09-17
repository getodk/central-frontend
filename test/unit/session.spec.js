import sinon from 'sinon';

import router from '../../src/router';
import store from '../../src/store';
import { logIn, logOut, restoreSession, useSessions } from '../../src/util/session';
import { noop } from '../../src/util/util';

import testData from '../data';
import { load, mockHttp } from '../util/http';
import { mockLogin } from '../util/session';
import { setData } from '../util/store';

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

      it('sends the correct request', () =>
        mockHttp()
          .request(() => restoreSession(store))
          .beforeEachResponse((_, { method, url }) => {
            method.should.equal('GET');
            url.should.equal('/v1/sessions/restore');
          })
          .respondWithData(() => testData.sessions.last()));

      it('saves the session', () =>
        mockHttp()
          .request(() => restoreSession(store))
          .respondWithData(() => testData.sessions.last())
          .afterResponse(() => {
            should.exist(store.state.request.data.session);
          }));

      it('does not set sessionExpires in local storage', () => {
        const setItem = sinon.fake();
        sinon.replace(Storage.prototype, 'setItem', setItem);
        return mockHttp()
          .request(() => restoreSession(store))
          .respondWithData(() => testData.sessions.last())
          .afterResponse(() => {
            setItem.called.should.be.false();
          });
      });

      it('removes sessionExpires from local storage after a 404', () =>
        mockHttp()
          .request(() => restoreSession(store).catch(noop))
          .respondWithProblem(404.1)
          .afterResponse(() => {
            should.not.exist(localStorage.getItem('sessionExpires'));
          }));
    });

    describe('session is expired', () => {
      beforeEach(() => {
        localStorage.setItem('sessionExpires', '0');
      });

      it('does not send a request', () =>
        mockHttp().testNoRequest(() => restoreSession(store).catch(noop)));

      it('returns a rejected promise', () =>
        restoreSession(store).should.be.rejected());
    });

    it('sends a request if sessionExpires is not in local storage', () => {
      testData.sessions.createPast(1);
      return mockHttp()
        .request(() => restoreSession(store))
        .respondWithData(() => testData.sessions.last());
    });
  });

  describe('login', () => {
    describe('request for the current user', () => {
      beforeEach(() => {
        testData.extendedUsers.createPast(1);
      });

      it('sends the correct request', () => {
        setData({ session: testData.sessions.createNew({ token: 'foo' }) });
        return mockHttp()
          .request(() => logIn(router, store, true))
          .beforeEachResponse((_, { method, url, headers }) => {
            method.should.equal('GET');
            url.should.equal('/v1/users/current');
            headers.Authorization.should.equal('Bearer foo');
            headers['X-Extended-Metadata'].should.equal('true');
          })
          .respondWithData(() => testData.extendedUsers.first());
      });

      it('saves currentUser', () => {
        setData({ session: testData.sessions.createNew() });
        return mockHttp()
          .request(() => logIn(router, store, true))
          .respondWithData(() => testData.extendedUsers.first())
          .afterResponse(() => {
            should.exist(store.state.request.data.currentUser);
          });
      });

      it('returns a promise', () => {
        setData({ session: testData.sessions.createNew() });
        return mockHttp()
          .request(() => logIn(router, store, true).should.be.fulfilled())
          .respondWithData(() => testData.extendedUsers.first());
      });
    });

    describe('newSession', () => {
      it('sets local storage if newSession is true', () => {
        sinon.useFakeTimers();
        testData.extendedUsers.createPast(1);
        setData({
          session: testData.sessions.createNew({
            expiresAt: '1970-01-02T00:00:00Z'
          })
        });
        return mockHttp()
          .request(() => logIn(router, store, true))
          .respondWithData(() => testData.extendedUsers.first())
          .afterResponse(() => {
            localStorage.getItem('sessionExpires').should.equal('86400000');
          });
      });

      it('does not set local storage if newSession is false', () => {
        testData.extendedUsers.createPast(1);
        setData({ session: testData.sessions.createNew() });
        return mockHttp()
          .request(() => logIn(router, store, false))
          .respondWithData(() => testData.extendedUsers.first())
          .afterResponse(() => {
            should.not.exist(localStorage.getItem('sessionExpires'));
          });
      });
    });
  });

  describe('logout', () => {
    it('sends the correct request', () => {
      testData.extendedUsers.createPast(1);
      setData({ session: testData.sessions.createNew({ token: 'foo' }) });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(router, store, false))
        .beforeEachResponse((_, { method, url, headers }) => {
          method.should.equal('DELETE');
          url.should.equal('/v1/sessions/foo');
          headers.Authorization.should.equal('Bearer foo');
        })
        .respondWithSuccess();
    });

    it('returns a promise', () => {
      testData.extendedUsers.createPast(1);
      setData({ session: testData.sessions.createNew() });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(router, store, false).should.be.fulfilled())
        .respondWithSuccess();
    });

    it('clears response data', () => {
      testData.extendedUsers.createPast(1);
      setData({ session: testData.sessions.createNew() });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          // Set data that is not cleared after a route change.
          setData({ roles: testData.standardRoles.sorted() });
        })
        .request(() => logOut(router, store, false))
        .respondWithSuccess()
        .afterResponse(() => {
          const { data } = store.state.request;
          should.not.exist(data.session);
          should.not.exist(data.currentUser);
          should.not.exist(data.roles);
        });
    });

    it('removes sessionExpires from local storage', () => {
      testData.extendedUsers.createPast(1);
      setData({ session: testData.sessions.createNew() });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(router, store, false))
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
          .request(app => logOut(app.vm.$router, app.vm.$store, false))
          .respondWithSuccess()
          .afterResponse(app => {
            app.vm.$route.fullPath.should.equal('/login');
          }));

      it('sets the ?next query parameter if setNext is true', () =>
        load('/users?foo=bar#baz')
          .complete()
          .request(app => logOut(app.vm.$router, app.vm.$store, true))
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
            app.vm.$store.commit('setUnsavedChanges', true);
          })
          .request(app => logOut(app.vm.$router, app.vm.$store, false))
          .respondWithSuccess()
          .afterResponse(app => {
            app.vm.$route.path.should.equal('/login');
            app.vm.$store.state.router.unsavedChanges.should.be.false();
            confirm.called.should.be.false();
          });
      });
    });

    describe('request results in an error', () => {
      beforeEach(() => {
        testData.extendedUsers.createPast(1);
        setData({ session: testData.sessions.createNew() });
      });

      it('returns a rejected promise', () =>
        mockHttp()
          .request(() => logIn(router, store, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(router, store, false).should.be.rejected())
          .respondWithProblem());

      it('shows a danger alert', () =>
        mockHttp()
          .request(() => logIn(router, store, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(router, store, false).catch(noop))
          .respondWithProblem({
            code: 500.1,
            message: 'logOut() problem.'
          })
          .afterResponse(() => {
            const { alert } = store.state;
            alert.state.should.be.true();
            alert.type.should.equal('danger');
            alert.message.should.startWith('There was a problem, and you were not fully logged out.');
            alert.message.should.endWith('logOut() problem.');
          }));

      it('returns a fulfilled promise for a 401.2 Problem', () =>
        mockHttp()
          .request(() => logIn(router, store, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(router, store, false).should.be.fulfilled())
          .respondWithProblem(401.2));

      it('returns a fulfilled promise for a 403.1 Problem', () =>
        mockHttp()
          .request(() => logIn(router, store, true))
          .respondWithData(() => testData.extendedUsers.first())
          .complete()
          .request(() => logOut(router, store, false).should.be.fulfilled())
          .respondWithProblem(403.1));
    });

    describe('logout during the request for the current user', () => {
      describe('initial navigation', () => {
        beforeEach(() => {
          testData.extendedUsers.createPast(1);
        });

        it('cancels the request for the current user', () =>
          load('/users', {}, false)
            .beforeEachResponse((app, { url }) => {
              if (url === '/v1/users/current')
                logOut(app.vm.$router, app.vm.$store, false).catch(noop);
            })
            .respondWithData(() => testData.sessions.createNew())
            .respondWithData(() => testData.extendedUsers.first())
            .respondWithProblem(401.2)
            .afterResponses(app => {
              const { state } = app.vm.$store.state.request.requests.currentUser.last;
              state.should.equal('canceled');
            }));

        it('does not navigate to /login', () => {
          const replace = sinon.fake();
          sinon.replace(router, 'replace', replace);
          return load('/reset-password')
            .beforeEachResponse((app, { url }) => {
              if (url === '/v1/users/current')
                logOut(app.vm.$router, app.vm.$store, false).catch(noop);
            })
            .respondWithData(() => testData.sessions.createNew())
            .respondWithData(() => testData.extendedUsers.first())
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
              if (url === '/v1/users/current')
                logOut(app.vm.$router, app.vm.$store, false).catch(noop);
            })
            .respondWithData(() => testData.sessions.createNew())
            .respondWithData(() => testData.extendedUsers.first())
            .respondWithProblem(401.2)
            .afterResponses(app => {
              const { state } = app.vm.$store.state.request.requests.currentUser.last;
              state.should.equal('canceled');
            }));

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
                logOut(app.vm.$router, app.vm.$store, false).catch(noop);
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
    beforeEach(() => {
      setData({ session: testData.sessions.createNew() });
    });

    it('logs out', () =>
      mockHttp()
        .request(() => logIn(router, store, true).catch(noop))
        .respondWithProblem()
        .respondWithSuccess()
        .afterResponses(() => {
          should.not.exist(store.state.request.data.session);
        }));

    it('returns a rejected promise', () =>
      mockHttp()
        .request(() => logIn(router, store, true).should.be.rejected())
        .respondWithProblem()
        .respondWithSuccess());
  });

  describe('logout before session expiration', () => {
    it('logs out a minute before the session expires', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
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
          should.not.exist(store.state.request.data.session);
        })
        .finally(cleanup);
    });

    it('sets the ?next query parameter', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      return load('/users', {}, false)
        .respondWithData(() =>
          testData.sessions.createNew({ expiresAt: '1970-01-01T00:05:00Z' }))
        .respondWithData(() => testData.extendedUsers.first())
        .respondFor('/users')
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
          app.vm.$route.query.next.should.equal('/users');
        });
    });

    it('shows an alert after the logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => {
          clock.tick(240000);
        })
        .respondWithSuccess()
        .afterResponse(() => {
          const { alert } = store.state;
          alert.state.should.be.true();
          alert.type.should.equal('info');
          alert.message.should.startWith('Your session has expired.');
        })
        .finally(cleanup);
    });

    it('does not attempt to log out if there was already a logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(router, store, false))
        .respondWithSuccess()
        .complete()
        .testNoRequest(() => {
          clock.tick(240000);
        })
        .finally(cleanup);
    });
  });

  describe('logout after session expiration', () => {
    it('does not send a request', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .testNoRequest(() => {
          clock.tick(300000);
          return logOut(router, store, false);
        });
    });

    it('returns a fulfilled promise', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(300000);
          return logOut(router, store, false).should.be.fulfilled();
        });
    });
  });

  describe('session expiration warning', () => {
    it('shows an alert 2 minutes before logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(119000);
          const { alert } = store.state;
          alert.state.should.be.false();
          clock.tick(1000);
          alert.state.should.be.true();
          alert.type.should.equal('info');
          alert.message.should.startWith('Your session will expire in 2 minutes,');
        })
        .finally(cleanup);
    });

    it('does not show the alert more than once for the same session', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(120000);
          const { alert } = store.state;
          alert.state.should.be.true();
          store.commit('hideAlert');
          clock.tick(30000);
          alert.state.should.be.false();
        })
        .request(() => logOut(router, store, false))
        .respondWithSuccess()
        .complete()
        .request(() => {
          setData({
            session: testData.sessions.createNew({
              expiresAt: '1970-01-01T00:07:30Z'
            })
          });
          return logIn(router, store, true);
        })
        .respondWithData(() => testData.extendedUsers.first())
        .afterResponse(() => {
          clock.tick(120000);
          store.state.alert.state.should.be.true();
        })
        .finally(cleanup);
    });

    it('does not show the alert if there was already a logout', () => {
      const clock = sinon.useFakeTimers();
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({
        session: testData.sessions.createNew({
          expiresAt: '1970-01-01T00:05:00Z'
        })
      });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(router, store, false))
        .respondWithSuccess()
        .afterResponse(() => {
          store.commit('hideAlert');
          clock.tick(120000);
          store.state.alert.state.should.be.false();
        })
        .finally(cleanup);
    });
  });

  describe('local storage changes', () => {
    it('logs out after sessionExpires changes', () => {
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({ session: testData.sessions.createNew() });
      return mockHttp()
        .request(() => logIn(router, store, true))
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
          should.not.exist(store.state.request.data.session);
        })
        .finally(cleanup);
    });

    it('logs out after local storage is cleared', () => {
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({ session: testData.sessions.createNew() });
      return mockHttp()
        .request(() => logIn(router, store, true))
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
          should.not.exist(store.state.request.data.session);
        })
        .finally(cleanup);
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
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({ session: testData.sessions.createNew() });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .request(() => logOut(router, store, false))
        .respondWithSuccess()
        .complete()
        .testNoRequest(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'sessionExpires',
            url: window.location.href
          }));
        })
        .finally(cleanup);
    });

    it('does not log out after a different item in local storage changes', () => {
      testData.extendedUsers.createPast(1);
      const cleanup = useSessions(router, store);
      setData({ session: testData.sessions.createNew() });
      return mockHttp()
        .request(() => logIn(router, store, true))
        .respondWithData(() => testData.extendedUsers.first())
        .complete()
        .testNoRequest(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'foo',
            url: window.location.href
          }));
        })
        .finally(cleanup);
    });
  });
});
