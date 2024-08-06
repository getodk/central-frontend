import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import Modal from '../../../src/components/modal.vue';

describe('FormPreview', () => {
  // eslint-disable-next-line no-console
  const originalConsoleLog = console.log;

  beforeEach(() => {
    mockLogin();
    // eslint-disable-next-line no-console
    console.log = () => {};
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.log = originalConsoleLog;
  });

  it('sends the correct initial requests', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load('/projects/1/forms/a/preview').testRequests([
      { url: '/v1/projects/1/forms/a', extended: true },
      { url: '/v1/projects/1/forms/a.xml' }
    ]);
  });

  it('renders new Web Form', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const app = await load('/projects/1/forms/a/preview').complete();

    const webForm = app.findComponent('.odk-form');

    webForm.exists().should.be.true;
  });

  it('shows preview modal', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    return load('/projects/1/forms/a/preview').testModalToggles({
      modal: Modal,
      show: '.footer button',
      hide: '.btn-primary'
    });
  });

  it('does not show navbar', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const app = await load('/projects/1/forms/a/preview').complete();

    app.findComponent({ name: 'Navbar' }).exists().should.be.false;
  });
});
