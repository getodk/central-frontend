import SubmissionDownloadButton from '../../../src/components/submission/download-button.vue';

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

  describe('submission count', () => {
    beforeEach(mockLogin);

    it('shows the count for the form draft, not the form', async () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      const draft = testData.extendedFormVersions
        .createPast(1, { draft: true, submissions: 2 })
        .last();
      testData.extendedSubmissions.createPast(2, { formVersion: draft });
      const component = await load('/projects/1/forms/f/draft', {
        root: false
      });
      const text = component.getComponent(SubmissionDownloadButton).text();
      text.should.equal('Download 2 Submissions…');
    });
  });

  describe('entities info box', async () => {
    it('shows the info box', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
      const app = await load('/projects/1/forms/f/draft');
      app.find('#form-draft-testing-entities').exists().should.be.true;
    });

    it('does not show the info box', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      app.find('#form-draft-testing-entities').exists().should.be.false;
    });
  });
});
