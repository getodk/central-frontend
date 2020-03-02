import FormAttachmentList from '../src/components/form-attachment/list.vue';
import SubmissionList from '../src/components/submission/list.vue';
import testData from './data';
import { load, mockRoute } from './util/http';
import { mockLogin, mockRouteThroughLogin } from './util/session';
import { trigger } from './util/event';

describe('router', () => {
  describe('use of next query param after login', () => {
    it('redirects the user to / if there is no param', () =>
      mockRouteThroughLogin('/login')
        .respondWithData(() => testData.extendedProjects.sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('uses the param to redirect the user', () =>
      mockRouteThroughLogin('/login?next=%2Fusers')
        .respondWithData(() => testData.extendedProjects.createPast(1))
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/users');
        }));

    it('does not redirect the user to a route to which they do not have access', () =>
      mockRouteThroughLogin('/login?next=%2Fusers', {}, { role: 'none' })
        .respondWithData(() => testData.extendedProjects.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('does not redirect the user away from Frontend', () =>
      mockRouteThroughLogin('/login?next=https%3A%2F%2Fwww.google.com%2F')
        .respondWithData(() => testData.extendedProjects.sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));
  });

  describe('requireLogin', () => {
    const paths = [
      '/projects/1',
      '/projects/1/users',
      '/projects/1/app-users',
      '/projects/1/form-access',
      '/projects/1/settings',
      '/projects/1/forms/f',
      '/projects/1/forms/f/media-files',
      '/projects/1/forms/f/submissions',
      '/projects/1/forms/f/settings'
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

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/users');
        }));
  });

  describe('validateData', () => {
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

        it('redirects from .../users', () =>
          load('/projects/1/users', {}, { projectAssignments: 403.1 })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects from .../app-users', () =>
          load('/projects/1/app-users', {}, { fieldKeys: 403.1 })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects from .../form-access', () =>
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
          load('/projects/1/forms/f', {}, { formActors: 403.1 })
            .respondFor('/', { users: false })
            .afterResponses(app => {
              app.vm.$route.path.should.equal('/');
            }));

        it('redirects the user from .../media-files', () =>
          load('/projects/1/forms/f/media-files')
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
      });
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
        load('/projects/1/forms/f/media-files')
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('redirects a user navigating from a different form', () =>
        load('/projects/1/forms/f2/media-files', {}, {
          form: () => testData.extendedForms.first(),
          formDraft: () => testData.extendedFormDrafts.first(),
          attachments: () => testData.standardFormAttachments
            .createPast(1, { form: testData.extendedForms.first() })
            .sorted()
        })
          .complete()
          .load('/projects/1/forms/f/media-files', {
            project: false,
            attachments: () => []
          })
          .respondFor('/')
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });
  });

  describe('after a route update', () => {
    beforeEach(mockLogin);

    it('resets and updates SubmissionList', () =>
      mockRoute('/projects/1/forms/f1/submissions')
        .beforeEachResponse((app, request, index) => {
          if (index === 5)
            request.url.should.equal('/v1/projects/1/forms/f1.schema.json?flatten=true&odata=true');
        })
        .respondWithData(() => testData.extendedProjects
          .createPast(1, { forms: 3, lastSubmission: new Date().toISOString() })
          .last())
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f1', submissions: 1 })
          .last())
        .respondWithProblem(404.1) // formDraft
        .respondWithProblem(404.1) // attachments
        .respondWithData(() => testData.standardKeys.sorted())
        .respondWithData(() => testData.extendedForms.last()._schema)
        .respondWithData(() => {
          testData.extendedSubmissions.createPast(1);
          return testData.submissionOData(1, 0);
        })
        .afterResponses(app => {
          app.first(SubmissionList).data().submissions.length.should.equal(1);
        })
        .route('/projects/1/forms/f2/submissions')
        .beforeAnyResponse(app => {
          should.not.exist(app.first(SubmissionList).data().submissions);
        })
        .beforeEachResponse((app, request, index) => {
          if (index === 4)
            request.url.should.equal('/v1/projects/1/forms/f2.schema.json?flatten=true&odata=true');
        })
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f2', submissions: 2 })
          .last())
        .respondWithProblem(404.1) // formDraft
        .respondWithProblem(404.1) // attachments
        .respondWithData(() => testData.standardKeys.sorted())
        .respondWithData(() => testData.extendedForms.last()._schema)
        .respondWithData(() => {
          const form = testData.extendedForms.last();
          testData.extendedSubmissions.createPast(2, { form });
          return testData.submissionOData(2, 1);
        })
        .afterResponses(app => {
          app.first(SubmissionList).data().submissions.length.should.equal(2);
        }));

    it('resets FormAttachmentList', () =>
      mockRoute('/projects/1/forms/f1/media-files')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { forms: 2 }).last())
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f1', draft: true })
          .last())
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() =>
          testData.standardFormAttachments.createPast(1).sorted())
        .afterResponses(app => {
          const files = [new File([''], 'a')];
          return trigger.dragAndDrop(app, FormAttachmentList, { files })
            .then(() => {
              const { unmatchedFiles } = app.first(FormAttachmentList).data();
              unmatchedFiles.length.should.equal(1);
            });
        })
        .route('/projects/1/forms/f2/media-files')
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f2', draft: true })
          .last())
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() => [
          testData.standardFormAttachments
            .createPast(1, {
              form: testData.extendedForms.last(),
              hasUpdatedAt: false
            })
            .last()
        ])
        .afterResponses(app => {
          const { unmatchedFiles } = app.first(FormAttachmentList).data();
          unmatchedFiles.length.should.equal(0);
        }));
  });
});
