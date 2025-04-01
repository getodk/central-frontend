import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setLoader } from '../../../src/util/load-async';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

describe('FormSubmission', () => {
  beforeAll(() => {
    // Mock WebFormRenderer - loading the real component creates dependency between tests because
    // it is loaded asynchronously
    setLoader('WebFormRenderer', async () => ({
      default: { foo: 'bar' },
      template: '<div class="odk-form">dummy renderer</div>'
    }));
  });

  describe('initial requests', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
    });

    it('sends the correct initial requests - Web Forms', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      return load('/projects/1/forms/a/submissions/new')
        .testRequests([
          { url: '/v1/projects/1', extended: true },
          { url: '/v1/projects/1/forms/a' },
        ]);
    });

    it('sends the correct initial requests - Enketo', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}?st=token`)
        .testRequests([
          { url: `/v1/enketo-ids/${enketoId}/form?st=token` }
        ]);
    });

    it('sends the correct initial requests for draft submission', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true, draft: true });
      return load('/projects/1/forms/a/draft/submissions/new')
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

      const app = await load('/projects/1/forms/a/submissions/new')
        .complete();

      const iframe = app.find('iframe');

      iframe.exists().should.be.true;
    });

    it('renders new Web Form', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });

      const app = await load('/projects/1/forms/a/submissions/new')
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
        await load('/projects/1/forms/a/submissions/new', { attachTo: document.body })
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          });
      });

      it('cannot access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit')
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
        load('/projects/1/forms/a/submissions/new')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));

      it('cannot access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    });

    describe('project manager', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'manager' });
        testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      });

      it('can access new submission page', () =>
        load('/projects/1/forms/a/submissions/new')
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          }));

      it('can access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit')
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          }));
    });
  });
});
