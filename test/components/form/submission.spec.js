import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import simpleXml from '../../data/simple';

describe('FormSubmission', () => {
  beforeEach(() => {
    mockLogin();
  });

  it('sends the correct initial requests - Web Forms', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
    return load('/projects/1/forms/a/submissions/new')
      .respondWithData(() => simpleXml)
      .testRequests([
        { url: '/v1/projects/1/forms/a' },
        { url: '/v1/projects/1/forms/a.xml' },
      ]);
  });

  it('sends the correct initial requests - Enketo', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load('/f/enketo-id/new?st=token')
      .testRequests([
        { url: '/v1/enketo-ids/enketo-id/form?st=token' }
      ]);
  });

  it.only('sends the correct initial requests for draft submission', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true, draft: true });
    return load('/f/enketo-id')
      .respondWithData(() => simpleXml)
      .testRequests([
        { url: '/v1/enketo-ids/enketo-id/form' },
        { url: ({ pathname }) => pathname.should.match(/v1\/test\/[a-zA-Z0-9]{64}\/projects\/1\/forms\/a\/draft.xml/) }
      ]);
  });

  it('renders Enketo Iframe', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const app = await load('/f/enketo-id/new')
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
