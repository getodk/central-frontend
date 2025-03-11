import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftTesting', () => {
  it('toggles the QR code for testing', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { draft: true });
    const component = await load('/projects/1/forms/f/draft', {
      root: false,
      attachTo: document.body
    });
    await component.get('#submission-list-test-on-device').trigger('click');
    should.exist(document.querySelector('.popover .form-draft-qr-panel'));
    await component.get('#submission-list-test-on-device').trigger('click');
    should.not.exist(document.querySelector('.popover'));
  });

  it('hides QR code on close button', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { draft: true });
    const component = await load('/projects/1/forms/f/draft', {
      root: false,
      attachTo: document.body
    });
    await component.get('#submission-list-test-on-device').trigger('click');
    should.exist(document.querySelector('.popover .form-draft-qr-panel'));
    await document.querySelector('.popover button').click();
    should.not.exist(document.querySelector('.popover'));
  });

  describe('dataset preview box', async () => {
    it('shows the dataset preview box', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
      const app = await load('/projects/1/forms/f/draft');
      app.find('#form-draft-testing-info .panel-dialog').exists().should.be.true;
    });

    it('does not show the dataset preview box', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      app.find('#form-draft-testing-info .panel-dialog').exists().should.be.false;
    });
  });
});
