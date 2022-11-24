import sinon from 'sinon';

import { noop } from '../src/util/util';

import testData from './data';
import { load } from './util/http';
import { mockLogin } from './util/session';
import { mockResponse } from './util/axios';

describe('createCentralRouter()', () => {
  describe('i18n', () => {
    before(() => {
      const has = Object.prototype.hasOwnProperty.call(navigator, 'language');
      has.should.be.false();
    });
    afterEach(() => {
      delete navigator.language;
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
        .afterResponses(app => {
          app.vm.$i18n.locale.should.equal('es');
        });
    });

    it('loads a less specific locale', () => {
      setLanguage('es-ES');
      return load('/login')
        .restoreSession(false)
        .afterResponses(app => {
          app.vm.$i18n.locale.should.equal('es');
        });
    });

    it('falls back to en for a locale that is not defined', () => {
      setLanguage('la');
      return load('/login')
        .restoreSession(false)
        .afterResponses(app => {
          app.vm.$i18n.locale.should.equal('en');
        });
    });

    it('loads the locale saved to local storage', () => {
      localStorage.setItem('locale', 'es');
      return load('/login')
        .restoreSession(false)
        .afterResponses(app => {
          app.vm.$i18n.locale.should.equal('es');
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
        .then(app => {
          app.vm.$i18n.locale.should.equal('es');
        });
    });
  });

  describe('restoreSession', () => {
    describe('restoreSession is false for the first route', () => {
      const paths = [
        `/account/claim?token=${'a'.repeat(64)}`,
        '/not-found'
      ];
      for (const path of paths) {
        it(`does not restore session for a user navigating to ${path}`, () =>
          load(path).testNoRequest());
      }

      it('does not restore the session in a later navigation', () =>
        load(`/account/claim?token=${'a'.repeat(64)}`)
          .complete()
          .route('/login')
          .testNoRequest());
    });

    describe('restoreSession is true for the first route', () => {
      beforeEach(() => {
        testData.extendedUsers.createPast(1, { role: 'none' });
      });

      it('sends the correct requests', () =>
        load('/account/edit', {}, false)
          .restoreSession()
          .respondFor('/account/edit')
          .testRequests([
            { url: '/v1/sessions/restore' },
            { url: '/v1/users/current', extended: true },
            null
          ]));

      it('does not redirect the user from a location that requires login', () =>
        load('/account/edit', {}, false)
          .restoreSession()
          .respondFor('/account/edit')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/account/edit');
          }));
    });
  });

  describe('requireLogin', () => {
    const paths = [
      '/',
      '/projects/1',
      '/projects/1/users',
      '/projects/1/app-users',
      '/projects/1/form-access',
      '/projects/1/datasets',
      '/projects/1/settings',
      '/projects/1/forms/f',
      '/projects/1/forms/f/versions',
      '/projects/1/forms/f/submissions',
      '/projects/1/forms/f/public-links',
      '/projects/1/forms/f/settings',
      '/projects/1/forms/f/draft',
      '/projects/1/forms/f/draft/attachments',
      '/projects/1/forms/f/draft/testing',
      '/projects/1/forms/f/submissions/s',
      '/users',
      // The redirect should pass through the query string and hash.
      '/users?x=y#z',
      '/users/2/edit',
      '/account/edit',
      '/system/backups',
      '/system/audits',
      '/system/analytics',
      '/dl/foo.txt'
    ];
    for (const path of paths) {
      it(`redirects an anonymous user navigating to ${path}`, () =>
        load(path, {}, false)
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

  describe('requireLogin is false and requireAnonymity is false', () => {
    it('does not redirect an anonymous user', async () => {
      const app = await load('/not-found');
      app.vm.$route.path.should.equal('/not-found');
    });

    it('does not redirect a user who is logged in', () => {
      mockLogin();
      return load('/account/edit')
        .complete()
        .route('/not-found')
        .then(app => {
          app.vm.$route.path.should.equal('/not-found');
        });
    });
  });

  describe('preserveData', () => {
    beforeEach(mockLogin);

    const dataExists = (names) => (app) => {
      const { requestData } = app.vm.$container;
      for (const name of names) {
        const resource = requestData[name] != null
          ? requestData[name]
          : requestData.localResources[name];
        resource.dataExists.should.be.true();
      }
    };

    describe('navigating between project routes', () => {
      beforeEach(() => {
        testData.extendedProjects.createPast(1, { datasets: 1 });
        testData.extendedDatasets.createPast(1);
        testData.extendedForms.createPast(1);
      });

      it('preserves data while navigating to/from the project overview', () =>
        load('/projects/1/form-access')
          .complete()
          .load('/projects/1', { project: false, forms: false }) // allow deletedForms to be fetched
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

      it('preserves data while navigating to/from .../datasets', () =>
        load('/projects/1/datasets')
          .complete()
          .route('/projects/1/settings')
          .complete()
          .route('/projects/1/datasets')
          .then(dataExists(['project', 'datasets'])));

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

    it('preserves project while navigating from submission detail page', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 's' });
      return load('/projects/1/forms/f/submissions/s')
        .complete()
        .load('/projects/1/forms/f/submissions', { project: false })
        .afterResponses(dataExists(['project']));
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

      const paths = [
        '/users',
        '/users/2/edit',
        '/system/backups',
        '/system/audits',
        '/system/analytics'
      ];
      for (const path of paths) {
        it(`redirects the user from ${path}`, () =>
          load(path, {}, false)
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));
      }

      it('redirects a user navigating from /account/edit to /users/:id/edit', () =>
        load('/account/edit')
          .complete()
          .route('/users/1/edit')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
      });

      describe('ProjectSettings', () => {
        it('redirects a user whose first navigation is to the route', () => {
          testData.extendedProjects.createPast(1, { role: 'viewer' });
          return load('/projects/1/settings')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            });
        });

        it('redirects a user navigating from a different project route', () => {
          testData.extendedProjects.createPast(1, { role: 'viewer' });
          return load('/projects/1', {}, { deletedForms: false })
            .complete()
            .route('/projects/1/settings')
            .respondFor('/', { users: false })
            .afterResponse(app => {
              app.vm.$route.path.should.equal('/');
            });
        });

        it('redirects a user navigating from a different project', () => {
          const managerProject = testData.extendedProjects
            .createPast(1, { role: 'manager' })
            .last();
          testData.extendedProjects.createPast(1, { role: 'viewer' });
          return load('/projects/1/settings', {}, {
            project: () => managerProject
          })
            .complete()
            .load('/projects/2/settings')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            });
        });
      });

      describe('other project routes', () => {
        beforeEach(() => {
          testData.extendedProjects.createPast(1, {
            role: 'viewer',
            forms: 1,
            datasets: 1,
            appUsers: 1
          });
          testData.extendedForms.createPast(1);
          testData.extendedDatasets.createPast(1);
          testData.extendedFieldKeys.createPast(1);
        });

        it('does not redirect the user from the project overview', async () => {
          const app = await load('/projects/1', {}, { deletedForms: false });
          app.vm.$route.path.should.equal('/projects/1');
        });

        it('redirects the user from .../users', () =>
          load('/projects/1/users', {}, {
            projectAssignments: () => mockResponse.problem(403.1)
          })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../app-users', () =>
          load('/projects/1/app-users', {}, {
            fieldKeys: () => mockResponse.problem(403.1)
          })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../form-access', () =>
          load('/projects/1/form-access', {}, {
            fieldKeys: () => mockResponse.problem(403.1),
            formSummaryAssignments: () => mockResponse.problem(403.1)
          })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('does not redirect the user from .../datasets', async () => {
          const app = await load('/projects/1/datasets');
          app.vm.$route.path.should.equal('/projects/1/datasets');
        });
      });

      describe('form routes', () => {
        beforeEach(() => {
          testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
          testData.extendedForms.createPast(1);
          testData.extendedFormVersions.createPast(1, { draft: true });
          testData.standardFormAttachments.createPast(1);
        });

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
        testData.extendedProjects.createPast(1, {
          role: 'formfill',
          datasets: 1
        });
        testData.extendedForms.createPast(1);
      });

      it('does not redirect the user from the project overview', async () => {
        const app = await load('/projects/1', {}, { deletedForms: false });
        app.vm.$route.path.should.equal('/projects/1');
      });

      for (const path of [
        // ProjectShow
        '/projects/1/users',
        '/projects/1/app-users',
        '/projects/1/form-access',
        '/projects/1/datasets',
        '/projects/1/settings',
        // FormShow
        '/projects/1/forms/f',
        '/projects/1/forms/f/versions',
        '/projects/1/forms/f/submissions',
        '/projects/1/forms/f/public-links',
        '/projects/1/forms/f/settings',
        '/projects/1/forms/f/draft',
        '/projects/1/forms/f/draft/attachments',
        '/projects/1/forms/f/draft/testing',
        // SubmissionShow
        '/projects/1/forms/f/submissions/s'
      ]) {
        it(`redirects the user from ${path}`, () =>
          load('/projects/1', {}, { deletedForms: false })
            .complete()
            .route(path)
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));
      }
    });

    describe('project without datasets', () => {
      beforeEach(mockLogin);

      it('redirects a user whose first navigation is to the route', () => {
        testData.extendedProjects.createPast(1);
        return load('/projects/1/datasets')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });

      it('redirects a user navigating from a different project route', () => {
        testData.extendedProjects.createPast(1);
        return load('/projects/1')
          .complete()
          .route('/projects/1/datasets')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });

      it('redirects a user navigating from a different project', () => {
        // Creating the dataset will also create a project.
        testData.extendedDatasets.createPast(1);
        // Create a second project.
        testData.extendedProjects.createPast(1);
        return load('/projects/1/datasets', {}, {
          project: () => testData.extendedProjects.first()
        })
          .complete()
          .load('/projects/2/datasets', { datasets: () => [] })
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
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
            formDraft: () => mockResponse.problem(404.1),
            attachments: () => mockResponse.problem(404.1)
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
          attachments: () => mockResponse.problem(404.1),
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

      it('redirects a user navigating from a different form', () => {
        testData.standardFormAttachments.createPast(1, {
          form: testData.extendedForms.first()
        });
        return load('/projects/1/forms/f2/draft/attachments', {}, {
          form: () => testData.extendedForms.first(),
          formDraft: () => testData.extendedFormDrafts.first(),
          attachments: () => testData.standardFormAttachments.sorted()
        })
          .complete()
          .load('/projects/1/forms/f/draft/attachments', {
            project: false,
            attachments: () => []
          })
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });
    });
  });

  // Karma does not allow us to navigate away from the document. Further, if
  // there is a beforeunload event, Karma seems to result in an error even if
  // the event is canceled. Because of that, we only test navigation away within
  // Frontend.
  describe('unsavedChanges', () => {
    beforeEach(mockLogin);

    it('navigates away if there are no unsaved changes', () => {
      const confirm = sinon.fake();
      sinon.replace(window, 'confirm', confirm);
      return load('/account/edit')
        .complete()
        .load('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
          confirm.called.should.be.false();
        });
    });

    describe('user confirms', () => {
      beforeEach(() => {
        sinon.replace(window, 'confirm', () => true);
      });

      it('navigates away', () =>
        load('/account/edit')
          .afterResponses(app => {
            app.vm.$container.unsavedChanges.plus(1);
          })
          .load('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('resets unsavedChanges', () =>
        load('/account/edit')
          .afterResponses(app => {
            app.vm.$container.unsavedChanges.plus(1);
          })
          .load('/')
          .afterResponses(app => {
            app.vm.$container.unsavedChanges.count.should.equal(0);
          }));
    });

    describe('user does not confirm', () => {
      beforeEach(() => {
        sinon.replace(window, 'confirm', () => false);
      });

      it('does not navigate away', async () => {
        const app = await load('/account/edit');
        app.vm.$container.unsavedChanges.plus(1);
        // TODO/vue3. Remove catch(noop).
        await app.vm.$router.push('/').catch(noop);
        app.vm.$route.path.should.equal('/account/edit');
      });

      it('does not change unsavedChanges', async () => {
        const app = await load('/account/edit');
        app.vm.$container.unsavedChanges.plus(1);
        // TODO/vue3. Remove catch(noop).
        await app.vm.$router.push('/').catch(noop);
        app.vm.$container.unsavedChanges.count.should.not.equal(0);
      });
    });
  });

  describe('title meta field', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1, {
        name: 'My Project Name',
        forms: 1,
        datasets: 1
      });
      testData.extendedForms.createPast(1, { xmlFormId: 'f1', name: 'My Form Name' });
      testData.extendedDatasets.createPast(1);
    });

    // There is approximately 1 test per route
    // excluding session-related routes like claim account, password reset,
    // which are handled in other test files.
    it('shows static homepage title for route /', async () => {
      await load('/');
      document.title.should.equal('Projects | ODK Central');
    });

    // Project routes
    it('inspects title before and after project data loaded', () =>
      load('/projects/1')
        .beforeAnyResponse(() => {
          document.title.should.equal('ODK Central');
        })
        .afterResponses(() => {
          document.title.should.equal('My Project Name | ODK Central');
        }));

    it('shows project name in title for /projects/1/user', async () => {
      await load('/projects/1/users');
      document.title.should.equal('Project Roles | My Project Name | ODK Central');
    });

    it('shows project name in title for /projects/1/app-users', async () => {
      await load('/projects/1/app-users');
      document.title.should.equal('App Users | My Project Name | ODK Central');
    });

    it('shows project name in title for /projects/1/form-access', async () => {
      await load('/projects/1/form-access');
      document.title.should.equal('Form Access | My Project Name | ODK Central');
    });

    it('shows project name in title for /projects/1/datasets', async () => {
      await load('/projects/1/datasets');
      document.title.should.equal('Datasets | My Project Name | ODK Central');
    });

    it('shows project name in title for /projects/1/settings', async () => {
      await load('/projects/1/settings');
      document.title.should.equal('Settings | My Project Name | ODK Central');
    });

    // Special cases of project routes
    it('does not show project name if null for /projects/1', async () => {
      testData.extendedProjects.createPast(1, { name: null });
      await load('/projects/2');
      document.title.should.equal('ODK Central');
    });

    // Form routes
    it('shows form name in title for <form url>/', async () => {
      await load('/projects/1/forms/f1');
      document.title.should.equal('My Form Name | ODK Central');
    });

    it('shows form name in title for <form url>/versions', async () => {
      await load('/projects/1/forms/f1/versions');
      document.title.should.equal('Versions | My Form Name | ODK Central');
    });

    it('shows form name in title for <form url>/submissions', async () => {
      await load('/projects/1/forms/f1/submissions');
      document.title.should.equal('Submissions | My Form Name | ODK Central');
    });

    it('shows form name in title for <form url>/public-links', async () => {
      await load('/projects/1/forms/f1/public-links');
      document.title.should.equal('Public Access | My Form Name | ODK Central');
    });

    it('shows form name in title for <form url>/settings', async () => {
      await load('/projects/1/forms/f1/settings');
      document.title.should.equal('Settings | My Form Name | ODK Central');
    });

    // Draft form routes
    it('shows form name in title for <form url>/draft', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f2', name: 'My Draft Form', draft: true });
      await load('/projects/1/forms/f2/draft');
      document.title.should.equal('Status | My Draft Form | ODK Central');
    });

    it('shows form name in title for <form url>/draft/attachments', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f2', name: 'My Draft Form', draft: true });
      testData.standardFormAttachments.createPast(1, { form: testData.extendedForms.last() });
      await load('/projects/1/forms/f2/draft/attachments')
        .respondWithData(() => testData.extendedDatasets.sorted());
      document.title.should.equal('Form Attachments | My Draft Form | ODK Central');
    });

    it('shows form name in title for <form url>/draft/testing', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f2', name: 'My Draft Form', draft: true });
      await load('/projects/1/forms/f2/draft/testing');
      document.title.should.equal('Testing | My Draft Form | ODK Central');
    });

    // Special cases of form routes
    it('shows form id when form has no name', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'my-xml-id', name: null });
      await load('/projects/1/forms/my-xml-id');
      document.title.should.equal('my-xml-id | ODK Central');
    });

    // Submission routes
    it('shows submission uuid', async () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 's' });
      await load('/projects/1/forms/f1/submissions/s');
      document.title.should.equal('Details: s | ODK Central');
    });

    // User routes
    it('shows static title for /users', async () => {
      await load('/users');
      document.title.should.equal('Web Users | ODK Central');
    });

    it('shows user name in title for /users/1/edit', async () => {
      testData.extendedUsers.createPast(1, { displayName: 'A User Name' });
      await load('/users/1/edit');
      document.title.should.equal('A User Name | ODK Central');
    });

    it('shows static title for /account/edit', async () => {
      await load('/account/edit');
      document.title.should.equal('Edit Profile | ODK Central');
    });

    // System Management routes
    it('shows static title for /system/backups', async () => {
      await load('/system/backups');
      document.title.should.equal('Backups | System Management | ODK Central');
    });

    it('shows static title for /system/audits', async () => {
      await load('/system/audits');
      document.title.should.equal('Server Audit Logs | System Management | ODK Central');
    });

    it('shows static title for /system/analytics', async () => {
      await load('/system/analytics');
      const { title } = document;
      title.should.equal('Usage Reporting | System Management | ODK Central');
    });

    // General special cases
    it('shows Page Not Found title', async () => {
      await load('/this-route-does-not-exist');
      document.title.should.equal('Page Not Found | ODK Central');
    });
  });

  describe('title meta field - logged out', () => {
    it('shows page title on login screen', () =>
      load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          document.title.should.equal('Log in | ODK Central');
        }));
  });

  describe('config', () => {
    beforeEach(mockLogin);

    it('redirects user from /system/backups if showsBackups is false', () => {
      const container = {
        config: { showsBackups: false }
      };
      return load('/system/backups', { container }, false)
        .respondFor('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('redirects user from /system/analytics if showsAnalytics is false', () => {
      const container = {
        config: { showsAnalytics: false }
      };
      return load('/system/analytics', { container }, false)
        .respondFor('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });
  });
});
