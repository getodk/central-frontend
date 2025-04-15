import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

describe('FormSubmission', () => {
  // Stub WebFormRenderer - loading the real component creates dependency between tests because
  // it is loaded asynchronously
  const mountOptions = () => ({
    global: {
      stubs: {
        WebFormRenderer: {
          template: '<div class="odk-form">dummy renderer</div>'
        }
      }
    }
  });

  describe('initial requests', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
    });

    it('sends the correct initial requests - Web Forms', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      return load('/projects/1/forms/a/submissions/new', mountOptions())
        .testRequests([
          { url: '/v1/projects/1', extended: true },
          { url: '/v1/projects/1/forms/a' },
        ]);
    });

    it('sends the correct initial requests - Enketo', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}?st=token`)
        .testRequests([
          { url: `/v1/form-links/${enketoId}/form?st=token` }
        ]);
    });

    it('sends the correct initial requests for draft submission', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true, draft: true });
      return load('/projects/1/forms/a/draft/submissions/new', mountOptions())
        .testRequests([
          { url: '/v1/projects/1', extended: true },
          { url: '/v1/projects/1/forms/a/draft' },
        ]);
    });
  });

  describe('renders the Form', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
    });

    it('renders Enketo Iframe', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });

      const app = await load('/projects/1/forms/a/submissions/new', mountOptions())
        .complete();

      const iframe = app.find('iframe');

      iframe.exists().should.be.true;
    });

    it('renders new Web Form', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });

      const app = await load('/projects/1/forms/a/submissions/new', mountOptions())
        .complete();

      const webForm = app.find('.odk-form');

      webForm.exists().should.be.true;
    });
  });

  describe('hasAccess', () => {
    describe('data collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill' });
        testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      });

      it('can access new submission page', async () => {
        await load('/projects/1/forms/a/submissions/new', mountOptions())
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          });
      });

      it('can access new draft submission page', async () => {
        await load('/projects/1/forms/a/draft/submissions/new', mountOptions())
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          });
      });

      it('cannot access new submission page if form is closed', async () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'b', webformsEnabled: true, state: 'closed' });
        await load('/projects/1/forms/b/submissions/new', mountOptions())
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });

      it('cannot access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit', mountOptions())
          .respondFor('/', { users: false })
          .afterResponses(async app => {
            app.vm.$route.path.should.equal('/');
          })
          .complete());
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer' });
        testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      });

      it('cannot access new submission page', () =>
        load('/projects/1/forms/a/submissions/new', mountOptions())
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('cannot access new draft submission page', () =>
        load('/projects/1/forms/a/draft/submissions/new', mountOptions())
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('cannot access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit', mountOptions())
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('cannot access new submission - offline', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a' });
        return load(`/f/${enketoId}/offline`)
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          });
      });
    });

    describe('project manager', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'manager' });
        testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      });

      it('can access new submission page', () =>
        load('/projects/1/forms/a/submissions/new', mountOptions())
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          }));

      it('can access new draft submission page', async () => {
        await load('/projects/1/forms/a/draft/submissions/new', mountOptions())
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          });
      });

      it('can access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit', mountOptions())
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          }));
    });
  });

  describe('redirects to canocial path', () => {
    beforeEach(() => {
      mockLogin();
    });

    it('should redirect to new submission page - offline', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}/offline`)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new/offline');
        });
    });

    it('should redirect to new draft submission page - offline', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
      return load(`/f/${enketoId}/offline`)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/draft/submissions/new/offline');
        });
    });

    it('should preserve form data while redirecting', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      let formRequestCount = 0;
      return load(`/f/${enketoId}/offline`)
        .beforeEachResponse((app, { url }) => {
          if (url.match(/form/)) formRequestCount += 1;
        })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new/offline');
          formRequestCount.should.equal(1);
        });
    });
  });
});
