import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import simpleXml from '../../data/simple';

describe('FormSubmission', () => {
  describe('initial requests', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
    });

    it('sends the correct initial requests - Web Forms', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      return load('/projects/1/forms/a/submissions/new')
        .respondWithData(() => simpleXml)
        .testRequests([
          { url: '/v1/projects/1', extended: true },
          { url: '/v1/projects/1/forms/a' },
          { url: '/v1/projects/1/forms/a.xml' },
        ]);
    });

    it('sends the correct initial requests - Enketo', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load('/f/enketo-id/new?st=token', {}, { project: false })
        .testRequests([
          { url: '/v1/enketo-ids/enketo-id/form?st=token' }
        ]);
    });

    it('sends the correct initial requests for draft submission', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true, draft: true });
      return load('/f/enketo-id', {}, { project: false })
        .respondWithData(() => simpleXml)
        .testRequests([
          { url: '/v1/enketo-ids/enketo-id/form' },
          { url: ({ pathname }) => pathname.should.match(/v1\/test\/[a-zA-Z0-9]{64}\/projects\/1\/forms\/a\/draft.xml/) }
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

      const app = await load('/f/enketo-id', {}, { project: false })
        .complete();

      const iframe = app.find('iframe');

      iframe.exists().should.be.true;
    });

    it('renders new Web Form', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });

      const app = await load('/projects/1/forms/a/submissions/new')
        .respondWithData(() => simpleXml)
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

      it('can access new submission page', () =>
        load('/projects/1/forms/a/submissions/new')
          .respondWithData(() => simpleXml)
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          }));

      it('cannot access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit')
          .respondFor('/', { users: false })
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
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
          .respondWithData(() => simpleXml)
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          }));

      it('can access edit submission page', () =>
        load('/projects/1/forms/a/submissions/1/edit')
          .respondWithData(() => simpleXml)
          .afterResponses(app => {
            app.find('.odk-form').exists().should.be.true;
          }));
    });
  });
});
