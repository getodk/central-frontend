import { setLoader } from '../../../src/util/load-async';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormPreview', () => {
  beforeAll(() => {
    // Mock WebFormRenderer - loading the real component creates dependency between tests because
    // it is loaded asynchronously
    setLoader('WebFormRenderer', async () => ({
      default: { foo: 'bar' },
      template: '<div class="odk-form">dummy renderer</div>'
    }));
  });

  beforeEach(() => {
    mockLogin();
  });

  it('sends the correct initial requests', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load('/projects/1/forms/a/preview').testRequests([
      { url: '/v1/projects/1/forms/a', extended: true },
    ]);
  });

  it('renders new Web Form', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });

    const app = await load('/projects/1/forms/a/preview')
      .complete();

    const webForm = app.find('.odk-form');

    webForm.exists().should.be.true;
  });

  it('does not show navbar', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const app = await load('/projects/1/forms/a/preview').complete();

    app.findComponent({ name: 'Navbar' }).exists().should.be.false;
  });
});
