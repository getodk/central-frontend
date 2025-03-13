import sinon from 'sinon';

import NotFound from '../src/components/not-found.vue';

import { noop } from '../src/util/util';
import { userLocale } from '../src/util/i18n';

import testData from './data';
import { load } from './util/http';
import { mockLogin } from './util/session';
import { mockResponse } from './util/axios';
import { setLanguages } from './util/i18n';

describe('createCentralRouter()', () => {
  describe('i18n', () => {
    it("loads the user's preferred language", () => {
      setLanguages(['es']);
      return load('/login')
        .restoreSession(false)
        .afterResponses(app => {
          app.vm.$i18n.locale.should.equal('es');
        });
    });

    it("falls back to en if no locale matches the user's preferences", () => {
      setLanguages(['la']);
      return load('/login')
        .restoreSession(false)
        .afterResponses(app => {
          app.vm.$i18n.locale.should.equal('en');
        });
    });

    it('only loads the locale during the initial navigation', () => {
      setLanguages(['es']);
      return load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          setLanguages(['en']);
          userLocale().should.equal('en');
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
      it('sends the correct requests', () => {
        testData.extendedUsers.createPast(1, { role: 'none' });
        return load('/account/edit', {}, false)
          .restoreSession()
          .respondFor('/account/edit')
          .testRequests([
            { url: '/v1/sessions/restore' },
            { url: '/v1/users/current', extended: true },
            null
          ]);
      });

      it('does not redirect the user from a location that requires login', () => {
        testData.extendedUsers.createPast(1, { role: 'none' });
        return load('/account/edit', {}, false)
          .restoreSession()
          .respondFor('/account/edit')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/account/edit');
          });
      });

      describe('OIDC is enabled', () => {
        const container = {
          config: { oidcEnabled: true }
        };

        it('sets sessionExpires if it is not set in local storage', () => {
          sinon.useFakeTimers();
          testData.extendedUsers.createPast(1, { role: 'none' });
          testData.sessions.createPast(1, { expiresAt: '1970-01-01T00:05:00Z' });
          return load('/account/edit', { container }, false)
            .restoreSession()
            .respondFor('/account/edit')
            .afterResponses(() => {
              localStorage.getItem('sessionExpires').should.equal('300000');
            });
        });

        it('sets sessionExpires if it is set to something different', () => {
          sinon.useFakeTimers();
          testData.extendedUsers.createPast(1, { role: 'none' });
          testData.sessions.createPast(1, { expiresAt: '1970-01-01T00:05:00Z' });
          localStorage.setItem('sessionExpires', '299999');
          return load('/account/edit', { container }, false)
            .restoreSession()
            .respondFor('/account/edit')
            .afterResponses(() => {
              localStorage.getItem('sessionExpires').should.equal('300000');
            });
        });
      });
    });
  });

  describe('redirects', () => {
    beforeEach(mockLogin);

    it('redirects to .../submissions from root path of form', async () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/settings')
        .complete()
        .route('/projects/1/forms/f')
        .respondForComponent('FormSubmissions')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f/submissions');
        });
    });

    it('redirects to .../entities from root path of entity list', async () => {
      testData.extendedDatasets.createPast(1);
      return load('/projects/1/entity-lists/trees/settings')
        .complete()
        .route('/projects/1/entity-lists/trees')
        .respondFor('/projects/1/entity-lists/trees/entities', {
          project: false,
          dataset: false
        })
        .afterResponses(app => {
          const { path } = app.vm.$route;
          path.should.equal('/projects/1/entity-lists/trees/entities');
        });
    });

    it('redirects if the hash is a path', () =>
      load('/#/account/edit', {}, false)
        .respondFor('/account/edit')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/account/edit');
        }));

    it('redirects if the hash is a path and it contains non-ascii characters', () => {
      testData.extendedForms.createPast(1);
      return load("/#/projects/1/forms/'%3D%2B%2F*-451%25%2F%25/submissions", {}, false)
        .respondFor("/projects/1/forms/'%3D%2B%2F*-451%25%2F%25/submissions")
        .afterResponses(app => {
          app.vm.$route.path.should.equal("/projects/1/forms/'%3D%2B%2F*-451%25%2F%25/submissions");
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
      '/projects/1/entity-lists',
      '/projects/1/entity-lists/trees/properties',
      '/projects/1/entity-lists/trees/settings',
      '/projects/1/entity-lists/trees/entities',
      '/projects/1/entity-lists/trees/entities/e',
      '/projects/1/settings',
      '/projects/1/forms/f/versions',
      '/projects/1/forms/f/submissions',
      '/projects/1/forms/f/public-links',
      '/projects/1/forms/f/settings',
      '/projects/1/forms/f/draft',
      '/projects/1/forms/f/submissions/s',
      '/users',
      // The redirect should pass through the query string and hash.
      '/users?x=y#z',
      '/users/2/edit',
      '/account/edit',
      '/system/audits',
      '/system/analytics',
      '/dl/projects/1/forms/f/submissions/s/attachments/a'
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

    it('redirects an anonymous user navigating to a redirect', () =>
      load('/projects/1/entity-lists/trees', {}, false)
        .restoreSession(false)
        .afterResponse(app => {
          const { $route } = app.vm;
          $route.path.should.equal('/login');
          const { next } = $route.query;
          // The `next` query parameter reflects the redirect.
          next.should.equal('/projects/1/entity-lists/trees/entities');
        }));
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
        resource.dataExists.should.be.true;
      }
    };

    it('preserves data if the path is the same', () => {
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: {}
      });
      return load('/projects/1/entity-lists/trees/entities/e', {
        attachTo: document.body
      })
        .complete()
        .route('/projects/1/entity-lists/trees/entities/e?foo=bar#v1')
        .then(dataExists(['project', 'dataset']));
    });

    describe('navigating between project routes', () => {
      beforeEach(() => {
        testData.extendedProjects.createPast(1, { datasets: 1 });
        testData.extendedDatasets.createPast(1);
        testData.extendedForms.createPast(1);
      });

      it('preserves data while navigating to/from the forms page', () =>
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

      it('preserves data while navigating to/from .../entity-lists', () =>
        load('/projects/1/entity-lists')
          .complete()
          .route('/projects/1/settings')
          .complete()
          .route('/projects/1/entity-lists')
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
            .route('/projects/1/forms/f/public-links')
            .respondForComponent('PublicLinkList')
            .complete()
            .route('/projects/1/forms/f/settings')
            .then(dataExists([
              'project',
              'form',
              'publishedAttachments',
              'formDatasetDiff',
              'appUserCount'
            ])));

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

    describe('navigating between dataset routes', () => {
      beforeEach(() => {
        testData.extendedDatasets.createPast(1, { name: 'trees' });
      });

      it('preserves project and dataset', () =>
        load('/projects/1/entity-lists/trees/properties')
          .complete()
          .load('/projects/1/entity-lists/trees/entities', { project: false, dataset: false })
          .complete()
          .load('/projects/1/entity-lists/trees/properties', { project: false, dataset: false })
          .afterResponses(dataExists(['project', 'dataset'])));
    });

    it('preserves project while navigating from entity list to project', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      return load('/projects/1/entity-lists/trees/properties')
        .complete()
        .load('/projects/1/entity-lists', { project: false })
        .afterResponses(dataExists(['project']));
    });

    it('preserves project while navigating from entity detail page', () => {
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/entity-lists/trees/entities/e')
        .complete()
        .load('/projects/1/entity-lists/trees/entities', { project: false })
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

        it('does not redirect the user from the forms page', async () => {
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

        it('does not redirect the user from .../entity-lists', async () => {
          const app = await load('/projects/1/entity-lists');
          app.vm.$route.path.should.equal('/projects/1/entity-lists');
        });
      });

      describe('form routes', () => {
        beforeEach(() => {
          testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
          testData.extendedForms.createPast(1);
        });

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
      });

      it('does not redirect user from submission detail page', async () => {
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
        testData.extendedSubmissions.createPast(1, { instanceId: 's' });
        const app = await load('/projects/1/forms/f/submissions/s');
        app.vm.$route.path.should.equal('/projects/1/forms/f/submissions/s');
      });

      describe('dataset routes', () => {
        beforeEach(() => {
          testData.extendedProjects.createPast(1, {
            role: 'viewer',
            datasets: 1
          });
          testData.extendedDatasets.createPast(1);
        });

        it('does not redirect the user from .../properties', async () => {
          const app = await load('/projects/1/entity-lists/trees/properties');
          app.vm.$route.path.should.equal('/projects/1/entity-lists/trees/properties');
        });

        it('does not redirect the user from .../entities', async () => {
          const app = await load('/projects/1/entity-lists/trees/entities');
          const { path } = app.vm.$route;
          path.should.equal('/projects/1/entity-lists/trees/entities');
        });

        it('redirects the user from .../settings', async () => {
          await load('/projects/1/entity-lists/trees/settings')
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            });
        });
      });

      it('does not redirect the user from the entity detail page', async () => {
        testData.extendedProjects.createPast(1, {
          role: 'viewer',
          datasets: 1
        });
        testData.extendedEntities.createPast(1, { uuid: 'e' });
        const app = await load('/projects/1/entity-lists/trees/entities/e');
        const { path } = app.vm.$route;
        path.should.equal('/projects/1/entity-lists/trees/entities/e');
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
        testData.extendedDatasets.createPast(1, { name: 'trees' });
      });

      it('does not redirect the user from the forms page', async () => {
        const app = await load('/projects/1', {}, { deletedForms: false });
        app.vm.$route.path.should.equal('/projects/1');
      });

      for (const path of [
        // ProjectShow
        '/projects/1/users',
        '/projects/1/app-users',
        '/projects/1/form-access',
        '/projects/1/entity-lists',
        '/projects/1/settings',
        // FormShow
        '/projects/1/forms/f',
        '/projects/1/forms/f/versions',
        '/projects/1/forms/f/submissions',
        '/projects/1/forms/f/public-links',
        '/projects/1/forms/f/settings',
        '/projects/1/forms/f/draft',
        // SubmissionShow
        '/projects/1/forms/f/submissions/s',
        // DatasetShow
        '/projects/1/entity-lists/trees',
        '/projects/1/entity-lists/trees/properties',
        '/projects/1/entity-lists/trees/entities',
        '/projects/1/entity-lists/trees/settings',
        // EntityShow
        '/projects/1/entity-lists/trees/entities/e'
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

    describe('form without a published version', () => {
      beforeEach(() => {
        mockLogin();
        testData.extendedProjects.createPast(1, { forms: 2 });
        testData.extendedForms
          .createPast(1, { xmlFormId: 'f2' })
          .createPast(1, { xmlFormId: 'f', draft: true });
      });

      describe('.../settings', () => {
        it('redirects a user whose first navigation is to the route', () =>
          load('/projects/1/forms/f/settings')
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects a user navigating from a different form route', () =>
          load('/projects/1/forms/f/draft')
            .complete()
            .route('/projects/1/forms/f/settings')
            .respondFor('/')
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects a user navigating from a different form', () =>
          load('/projects/1/forms/f2/settings', {}, {
            form: () => testData.extendedForms.first()
          })
            .complete()
            .load('/projects/1/forms/f/settings', { project: false })
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

      it('redirects the user from the root path for the form', () =>
        load('/projects/1/forms/f')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
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
          confirm.called.should.be.false;
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
          document.title.should.equal('Forms | ODK Central');
        })
        .afterResponses(() => {
          document.title.should.equal('Forms | My Project Name | ODK Central');
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

    it('shows project name in title for /projects/1/entity-lists', async () => {
      await load('/projects/1/entity-lists');
      document.title.should.equal('Entities | My Project Name | ODK Central');
    });

    it('shows project name in title for /projects/1/settings', async () => {
      await load('/projects/1/settings');
      document.title.should.equal('Settings | My Project Name | ODK Central');
    });

    // Form routes

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

    it('shows form name in title for <form url>/draft', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f2', name: 'My Draft Form', draft: true });
      await load('/projects/1/forms/f2/draft');
      document.title.should.equal('Edit Form | My Draft Form | ODK Central');
    });

    // Special cases of form routes
    it('shows form id when form has no name', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'my-xml-id', name: null });
      await load('/projects/1/forms/my-xml-id/settings');
      document.title.should.equal('Settings | my-xml-id | ODK Central');
    });

    // Submission routes
    it('shows submission uuid', async () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 's' });
      await load('/projects/1/forms/f1/submissions/s');
      document.title.should.equal('Details: s | ODK Central');
    });

    // Dataset routes

    it('shows dataset name in title for /projects/1/entity-lists/:datasetName/properties', async () => {
      await load('/projects/1/entity-lists/trees/properties');
      document.title.should.equal('Properties | trees | ODK Central');
    });

    it('shows dataset name in title for /projects/1/entity-lists/:datasetName/entities', async () => {
      await load('/projects/1/entity-lists/trees/entities');
      document.title.should.equal('Entities | trees | ODK Central');
    });

    it('shows dataset name in title for /projects/1/entity-lists/:datasetName/settings', async () => {
      await load('/projects/1/entity-lists/trees/settings');
      document.title.should.equal('Settings | trees | ODK Central');
    });

    // Entity routes
    it('shows the entity label', async () => {
      testData.extendedEntities.createPast(1, {
        uuid: 'e',
        label: 'My Entity'
      });
      await load('/projects/1/entity-lists/trees/entities/e');
      document.title.should.equal('My Entity | ODK Central');
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
    it('shows static title for /load-error', () => {
      const container = { config: false };
      return load('/login', { container })
        .restoreSession(false)
        .respond(() => ({ status: 502 })) // config
        .afterResponses(() => {
          document.title.should.equal('Error | ODK Central');
        });
    });

    it('shows page title on login screen', () =>
      load('/login')
        .restoreSession(false)
        .afterResponses(() => {
          document.title.should.equal('Log in | ODK Central');
        }));
  });

  describe('config', () => {
    it('requests the config', () => {
      // Using a role of 'none' in order to prevent some requests.
      const user = testData.extendedUsers
        .createPast(1, { role: 'none' })
        .first();
      const session = testData.sessions.createPast(1).last();
      const container = { config: false };
      return load('/', { container }, false)
        .respondWithData(() => session)
        .respondWithData(() => ({})) // config
        .respondWithData(() => user)
        .respondFor('/', { users: false })
        .beforeAnyResponse(app => {
          app.vm.$container.requestData.config.dataExists.should.be.false;
        })
        .testRequests([
          { url: '/v1/sessions/restore' },
          { url: '/client-config.json' },
          { url: '/v1/users/current', extended: true },
          { url: '/v1/projects?forms=true&datasets=true' }
        ])
        .afterResponses(app => {
          const { config } = app.vm.$container.requestData;
          config.data.should.include({ oidcEnabled: false });
        });
    });

    describe('error loading config', () => {
      it('redirects to /load-error', () => {
        const container = { config: false };
        return load('/login', { container })
          .restoreSession(false)
          .respond(() => ({ status: 502 })) // config
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/load-error');
          });
      });

      it('does not request the current user', () => {
        testData.extendedUsers.createPast(1);
        const session = testData.sessions.createPast(1).last();
        const container = { config: false };
        return load('/login', { container })
          .respondWithData(() => session)
          .respond(() => ({ status: 502 }))
          .testRequests([
            { url: '/v1/sessions/restore' },
            { url: '/client-config.json' }
          ]);
      });

      it('clears the session', () => {
        testData.extendedUsers.createPast(1);
        const session = testData.sessions.createPast(1).last();
        const container = { config: false };
        return load('/login', { container })
          .respondWithData(() => session)
          .respond(() => ({ status: 502 }))
          .beforeEachResponse((app, config, i) => {
            if (i === 1)
              app.vm.$container.requestData.session.dataExists.should.be.true;
          })
          .afterResponses(app => {
            app.vm.$container.requestData.session.dataExists.should.be.false;
          });
      });

      it('redirects from /load-error if there was not an error', () =>
        load('/load-error')
          .restoreSession(false)
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/login');
          }));
    });

    describe('OIDC is enabled', () => {
      const container = {
        config: { oidcEnabled: true }
      };

      it('renders NotFound for /reset-password', () =>
        load('/reset-password', { container })
          .restoreSession(false)
          .afterResponses(app => {
            app.findComponent(NotFound).exists().should.be.true;
          }));

      it('renders NotFound for /account/claim', async () => {
        const app = await load(`/account/claim?token=${'a'.repeat(64)}`, {
          container
        });
        app.findComponent(NotFound).exists().should.be.true;
      });
    });

    it('renders NotFound for /system/analytics if showsAnalytics is false', async () => {
      mockLogin();
      const container = {
        config: { showsAnalytics: false }
      };
      const app = await load('/system/analytics', { container }, false);
      app.findComponent(NotFound).exists().should.be.true;
    });
  });

  describe('standalone field', () => {
    it('adds a background color if standalone is false', async () => {
      await load('/login').restoreSession(false);
      document.documentElement.style.backgroundColor.should.equal('var(--color-accent-secondary)');
    });
  });
});
