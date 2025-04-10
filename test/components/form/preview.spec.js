import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormPreview', () => {
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

  beforeEach(() => {
    mockLogin();
  });

  it('sends the correct initial requests', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load('/projects/1/forms/a/preview', mountOptions())
      .testRequests([
        { url: '/v1/projects/1/forms/a', extended: true },
      ]);
  });

  it('renders new Web Form', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });

    const app = await load('/projects/1/forms/a/preview', mountOptions())
      .complete();

    const webForm = app.find('.odk-form');

    webForm.exists().should.be.true;
  });

  it('does not show navbar', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const app = await load('/projects/1/forms/a/preview', mountOptions())
      .complete();

    app.findComponent({ name: 'Navbar' }).exists().should.be.false;
  });
});
