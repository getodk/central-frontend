import sinon from 'sinon';

import i18n from '../src/i18n';
import { loadLocale } from '../src/util/i18n';

import testData from './data';
import { load, mockRoute } from './util/http';
import { mockLogin } from './util/session';

describe('router', () => {
  describe('i18n', () => {
    before(() => {
      const has = Object.prototype.hasOwnProperty.call(navigator, 'language');
      has.should.be.false();
    });
    afterEach(() => {
      delete navigator.language;
      return loadLocale('en');
    });

    const setLanguage = (locale) => {
      Object.defineProperty(navigator, 'language', {
        value: locale,
        configurable: true
      });
    };

    it("loads the user's preferred language", () => {
      setLanguage('es');
      return load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          i18n.locale.should.equal('es');
        });
    });

    it('loads a less specific locale', () => {
      setLanguage('es-ES');
      return load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          i18n.locale.should.equal('es');
        });
    });

    it('falls back to en for a locale that is not defined', () => {
      setLanguage('la');
      return load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          i18n.locale.should.equal('en');
        });
    });

    it('loads the locale saved to local storage', () => {
      localStorage.setItem('locale', 'es');
      return load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          i18n.locale.should.equal('es');
        });
    });

    it('only loads the locale during the initial navigation', () => {
      setLanguage('es');
      return load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          setLanguage('en');
        })
        .route('/reset-password')
        .then(() => {
          i18n.locale.should.equal('es');
        });
    });
  });

  describe('restoreSession', () => {
    describe('restoreSession is false for the first route', () => {
      const location = {
        path: '/account/claim',
        query: { token: 'a'.repeat(64) }
      };

      it('does not restore the session during the initial navigation', () =>
        load(location).testNoRequest());

      it('does not restore the session in a later navigation', () =>
        load(location)
          .complete()
          .route('/login')
          .testNoRequest());
    });

    describe('restoreSession is true for the first route', () => {
      beforeEach(() => {
        testData.extendedUsers.createPast(1);
      });

      it('sends the correct request', () =>
        load('/users', {}, false)
          .beforeEachResponse((_, { method, url }) => {
            method.should.equal('GET');
            url.should.equal('/v1/sessions/restore');
          })
          .restoreSession(false));

      it('does not redirect the user from a location that requires login', () =>
        load('/users', {}, false)
          .restoreSession(true)
          .respondFor('/users')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/users');
          }));

      it('does not set sessionExpires', () => {
        const setItem = sinon.fake();
        sinon.replace(Storage.prototype, 'setItem', setItem);
        return load('/users', {}, false)
          .restoreSession(true)
          .respondFor('/users')
          .afterResponses(() => {
            setItem.called.should.be.false();
          });
      });

      it('does not send a request if the session has expired', () => {
        localStorage.setItem('sessionExpires', '0');
        return load('/users', {}, false).testNoRequest();
      });
    });
  });

  describe('requireLogin', () => {
    const paths = [
      '/',
      '/projects/1',
      '/projects/1/users',
      '/projects/1/app-users',
      '/projects/1/form-access',
      '/projects/1/settings',
      '/projects/1/forms/f',
      '/projects/1/forms/f/versions',
      '/projects/1/forms/f/submissions',
      '/projects/1/forms/f/public-links',
      '/projects/1/forms/f/settings',
      '/projects/1/forms/f/draft',
      '/projects/1/forms/f/draft/attachments',
      '/projects/1/forms/f/draft/testing',
      '/users',
      // The redirect should pass through the query string and hash.
      '/users?x=y#z',
      '/users/2/edit',
      '/account/edit',
      '/system/backups',
      '/system/audits',
      '/dl/foo.txt'
    ];

    for (const path of paths) {
      it(`redirects an anonymous user navigating to ${path}`, () =>
        mockRoute(path)
          .restoreSession(false)
          .afterResponse(app => {
            const { $route } = app.vm;
            $route.path.should.equal('/login');
            $route.query.next.should.equal(path);
          }));
    }
  });

  describe('requireAnonymity', () => {
    const paths = [
      '/login',
      '/reset-password',
      `/account/claim?token=${'a'.repeat(64)}`
    ];

    for (const path of paths) {
      it(`redirects a logged in user navigating to ${path}`, () => {
        mockLogin();
        return load('/account/edit')
          .complete()
          .route(path)
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });
    }
  });

  describe('preserveData', () => {
    beforeEach(mockLogin);

    const dataExists = (keys) => (app) => {
      for (const key of keys)
        should.exist(app.vm.$store.state.request.data[key]);
    };

    describe('navigating between project routes', () => {
      beforeEach(() => {
        testData.extendedProjects.createPast(1, { appUsers: 0 });
      });

      it('preserves data while navigating to/from the project overview', () =>
        // Load .../form-access, which requests all the data that the project
        // overview uses.
        load('/projects/1/form-access')
          .complete()
          .route('/projects/1')
          .complete()
          .route('/projects/1/form-access')
          .then(dataExists(['project', 'forms'])));

      describe('navigating to/from .../users', () => {
        it('preserves project', () =>
          load('/projects/1/settings')
            .complete()
            .load('/projects/1/users', { project: false })
            .complete()
            .route('/projects/1/settings')
            .then(dataExists(['project'])));

        it('preserves roles', () =>
          load('/projects/1/form-access')
            .complete()
            .load('/projects/1/users', { project: false, roles: false })
            .complete()
            .route('/projects/1/form-access')
            .then(dataExists(['roles'])));

        // Only .../users uses projectAssignments, but we test that the data is
        // preserved if the user navigates away, then back.
        it('preserves projectAssignments', () =>
          load('/projects/1/users')
            .complete()
            .route('/projects/1/settings')
            .complete()
            .route('/projects/1/users')
            .then(dataExists(['projectAssignments'])));
      });

      it('preserves data while navigating to/from .../app-users', () =>
        load('/projects/1/form-access')
          .complete()
          .route('/projects/1/app-users')
          .complete()
          .route('/projects/1/form-access')
          .then(dataExists(['project', 'fieldKeys'])));

      describe('navigating to/from .../form-access', () => {
        it('preserves project', () =>
          load('/projects/1/settings')
            .complete()
            .load('/projects/1/form-access', { project: false })
            .complete()
            .route('/projects/1/settings')
            .then(dataExists(['project'])));

        it('preserves roles', () =>
          load('/projects/1/users')
            .complete()
            .load('/projects/1/form-access', { project: false, roles: false })
            .complete()
            .route('/projects/1/users')
            .then(dataExists(['roles'])));

        it('preserves forms', () =>
          load('/projects/1')
            .complete()
            .load('/projects/1/form-access', { project: false, forms: false })
            .complete()
            .route('/projects/1')
            .then(dataExists(['forms'])));

        it('preserves fieldKeys', () =>
          load('/projects/1/app-users')
            .complete()
            .load('/projects/1/form-access', { project: false, fieldKeys: false })
            .complete()
            .route('/projects/1/app-users')
            .then(dataExists(['fieldKeys'])));

        it('preserves formSummaryAssignments', () =>
          load('/projects/1/form-access')
            .complete()
            .route('/projects/1/settings')
            .complete()
            .route('/projects/1/form-access')
            .then(dataExists(['formSummaryAssignments'])));
      });

      it('preserves data while navigating to/from .../settings', () =>
        load('/projects/1')
          .complete()
          .route('/projects/1/settings')
          .complete()
          .route('/projects/1')
          .then(dataExists(['project'])));
    });

    describe('navigating between form routes', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1);
        testData.extendedFormVersions.createPast(1, { draft: true });
        testData.standardFormAttachments.createPast(1);
      });

      describe('navigating to/from .../public-links', () => {
        it('preserves data that FormShow uses', () =>
          load('/projects/1/forms/f/settings')
            .complete()
            .load('/projects/1/forms/f/public-links', {
              project: false,
              form: false,
              formDraft: false,
              attachments: false
            })
            .complete()
            .route('/projects/1/forms/f/settings')
            .then(dataExists(['project', 'form', 'formDraft', 'attachments'])));

        it('preserves publicLinks', () =>
          load('/projects/1/forms/f/public-links')
            .complete()
            .route('/projects/1/forms/f/settings')
            .complete()
            .route('/projects/1/forms/f/public-links')
            .then(dataExists(['publicLinks'])));
      });
    });

    describe('navigating between project and form routes', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1);
      });

      it('preserves project while navigating to/from a form route', () =>
        load('/projects/1/settings')
          .complete()
          .load('/projects/1/forms/f/settings', { project: false })
          .complete()
          .route('/projects/1/settings')
          .then(dataExists(['project'])));

      it('preserves project while navigating to/from a project route', () =>
        load('/projects/1/forms/f/settings')
          .complete()
          .route('/projects/1/settings')
          .complete()
          .load('/projects/1/forms/f/settings', { project: false })
          .then(dataExists(['project'])));
    });
  });

  describe('validateData', () => {
    describe('user without a sitewide role', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
      });

      it('does not redirect the user from /', async () => {
        const app = await load('/', {}, { users: false });
        app.vm.$route.path.should.equal('/');
      });

      it('does not redirect the user from /account/edit', async () => {
        const app = await load('/account/edit');
        app.vm.$route.path.should.equal('/account/edit');
      });

      it('redirects the user from /users/:id/edit', () =>
        mockRoute('/users/2/edit')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a user navigating from /account/edit to /users/:id/edit', () => {
        testData.extendedProjects.createPast(1);
        return load('/account/edit')
          .complete()
          .route('/users/1/edit')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });

      it('redirects the user from /system/backups', () =>
        mockRoute('/system/backups')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects the user from /system/audits', () =>
        mockRoute('/system/audits')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });

        testData.extendedProjects.createPast(1, { role: 'manager', forms: 1 });

        const project = testData.extendedProjects
          .createPast(1, { role: 'viewer', forms: 1, appUsers: 1 })
          .last();
        testData.extendedForms.createPast(1, { project });
        testData.extendedFormVersions.createPast(1, { draft: true });
        testData.standardFormAttachments.createPast(1);
      });

      describe('project routes', () => {
        describe('.../settings', () => {
          it('redirects a user whose first navigation is to the route', () =>
            load('/projects/1/settings')
              .respondFor('/', { users: false })
              .afterResponses(app => {
                app.vm.$route.path.should.equal('/');
              }));

          it('redirects a user navigating from a different project route', () =>
            load('/projects/1')
              .complete()
              .route('/projects/1/settings')
              .respondFor('/', { users: false })
              .afterResponse(app => {
                app.vm.$route.path.should.equal('/');
              }));

          it('redirects a user navigating from a different project', () =>
            load('/projects/1/settings', {}, {
              project: () => testData.extendedProjects.first()
            })
              .complete()
              .load('/projects/2/settings')
              .respondFor('/', { users: false })
              .afterResponses(app => {
                app.vm.$route.path.should.equal('/');
              }));
        });

        it('does not redirect the user from the project overview', async () => {
          const app = await load('/projects/1');
          app.vm.$route.path.should.equal('/projects/1');
        });

        it('redirects the user from .../users', () =>
          load('/projects/1/users', {}, { projectAssignments: 403.1 })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../app-users', () =>
          load('/projects/1/app-users', {}, { fieldKeys: 403.1 })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../form-access', () =>
          load('/projects/1/form-access', {}, {
            fieldKeys: 403.1,
            formSummaryAssignments: 403.1
          })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));
      });

      describe('form routes', () => {
        it('redirects the user from the form overview', () =>
          load('/projects/1/forms/f')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('does not redirect the user from .../versions', async () => {
          const app = await load('/projects/1/forms/f/versions');
          app.vm.$route.path.should.equal('/projects/1/forms/f/versions');
        });

        it('does not redirect the user from .../submissions', async () => {
          const app = await load('/projects/1/forms/f/submissions');
          app.vm.$route.path.should.equal('/projects/1/forms/f/submissions');
        });

        it('redirects the user from .../public-links', () =>
          load('/projects/1/forms/f/public-links')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../settings', () =>
          load('/projects/1/forms/f/settings')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../draft', () =>
          load('/projects/1/forms/f/draft')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../draft/attachments', () =>
          load('/projects/1/forms/f/draft/attachments')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('does not redirect the user from .../draft/testing', async () => {
          const app = await load('/projects/1/forms/f/draft/testing');
          app.vm.$route.path.should.equal('/projects/1/forms/f/draft/testing');
        });
      });
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
        testData.extendedForms.createPast(1);
        testData.extendedFormVersions.createPast(1, { draft: true });
        testData.standardFormAttachments.createPast(1);
      });

      describe('project routes', () => {
        it('does not redirect the user from the project overview', async () => {
          const app = await load('/projects/1');
          app.vm.$route.path.should.equal('/projects/1');
        });

        for (const path of [
          '/projects/1/users',
          '/projects/1/app-users',
          '/projects/1/form-access',
          '/projects/1/settings'
        ]) {
          it(`redirects the user from ${path}`, () =>
            load('/projects/1')
              .complete()
              .route(path)
              .respondFor('/', { users: false })
              .afterResponses(app => {
                app.vm.$route.path.should.equal('/');
              }));
        }
      });

      describe('form routes', () => {
        for (const path of [
          '/projects/1/forms/f',
          '/projects/1/forms/f/versions',
          '/projects/1/forms/f/submissions',
          '/projects/1/forms/f/public-links',
          '/projects/1/forms/f/settings',
          '/projects/1/forms/f/draft',
          '/projects/1/forms/f/draft/attachments',
          '/projects/1/forms/f/draft/testing'
        ]) {
          it(`redirects the user from ${path}`, () =>
            load('/projects/1')
              .complete()
              .route(path)
              .respondFor('/', { users: false })
              .afterResponses(app => {
                app.vm.$route.path.should.equal('/');
              }));
        }
      });
    });

    describe('form without a published version', () => {
      beforeEach(() => {
        mockLogin();
        testData.extendedProjects.createPast(1, { forms: 2 });
        testData.extendedForms
          .createPast(1, { xmlFormId: 'f2' })
          .createPast(1, { xmlFormId: 'f', draft: true });
      });

      describe('form overview', () => {
        it('redirects a user whose first navigation is to the route', () =>
          load('/projects/1/forms/f')
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects a user navigating from a different form route', () =>
          load('/projects/1/forms/f/draft')
            .complete()
            .route('/projects/1/forms/f')
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects a user navigating from a different form', () =>
          load('/projects/1/forms/f2', {}, {
            form: () => testData.extendedForms.first(),
            formDraft: 404.1,
            attachments: 404.1
          })
            .complete()
            .load('/projects/1/forms/f', { project: false })
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));
      });

      it('redirects the user from .../versions', () =>
        load('/projects/1/forms/f/versions', {}, { formVersions: () => [] })
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects the user from .../submissions', () =>
        load('/projects/1/forms/f/submissions')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects the user from .../public-links', () =>
        load('/projects/1/forms/f/public-links')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects the user from .../settings', () =>
        load('/projects/1/forms/f/settings')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });

    describe('form without a draft', () => {
      beforeEach(() => {
        mockLogin();
        testData.extendedProjects.createPast(1, { forms: 2 });
        testData.extendedForms
          .createPast(1, { xmlFormId: 'f2', draft: true })
          .createPast(1, { xmlFormId: 'f' });
      });

      describe('.../draft', () => {
        it('redirects a user whose first navigation is to the route', () =>
          load('/projects/1/forms/f/draft')
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects a user navigating from a different form route', () =>
          load('/projects/1/forms/f')
            .complete()
            .route('/projects/1/forms/f/draft')
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects a user navigating from a different form', () =>
          load('/projects/1/forms/f2/draft', {}, {
            form: () => testData.extendedForms.first(),
            formDraft: () => testData.extendedFormDrafts.first(),
            attachments: () => [],
            formVersions: () => []
          })
            .complete()
            .load('/projects/1/forms/f/draft', { project: false })
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));
      });

      it('redirects the user from .../draft/attachments', () =>
        load('/projects/1/forms/f/draft/attachments')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects the user from .../draft/testing', () =>
        load('/projects/1/forms/f/draft/testing')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects user after a 404 for formDraft but a 200 for attachments', () =>
        load('/projects/1/forms/f/draft/attachments', {}, {
          attachments: () => testData.standardFormAttachments
            .createPast(1, { form: testData.extendedForms.last() })
            .sorted()
        })
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects user after a 200 for formDraft but a 404 for attachments', () =>
        load('/projects/1/forms/f2/draft', {}, {
          form: () => testData.extendedForms.first(),
          formDraft: () => testData.extendedFormDrafts.first(),
          attachments: 404.1,
          formVersions: () => []
        })
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });

    describe('form draft without attachments', () => {
      beforeEach(() => {
        mockLogin();
        testData.extendedProjects.createPast(1, { forms: 2 });
        testData.extendedForms
          .createPast(1, { xmlFormId: 'f2', draft: true })
          .createPast(1, { xmlFormId: 'f', draft: true });
      });

      it('redirects a user whose first navigation is to the route', () =>
        load('/projects/1/forms/f/draft/attachments')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a user navigating from a different form route', () =>
        load('/projects/1/forms/f/draft')
          .complete()
          .route('/projects/1/forms/f/draft/attachments')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a user navigating from a different form', () =>
        load('/projects/1/forms/f2/draft/attachments', {}, {
          form: () => testData.extendedForms.first(),
          formDraft: () => testData.extendedFormDrafts.first(),
          attachments: () => testData.standardFormAttachments
            .createPast(1, { form: testData.extendedForms.first() })
            .sorted()
        })
          .complete()
          .load('/projects/1/forms/f/draft/attachments', {
            project: false,
            attachments: () => []
          })
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });
  });
});
