import ChecklistStep from '../../../src/components/checklist-step.vue';
import FormDraftStatus from '../../../src/components/form-draft/status.vue';
import SubmissionDownloadButton from '../../../src/components/submission/download-button.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftTesting', () => {
  it('toggles the QR code for testing', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { draft: true });
    const component = await load('/projects/1/forms/f/draft/testing', {
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
    const component = await load('/projects/1/forms/f/draft/testing', {
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
      const component = await load('/projects/1/forms/f/draft/testing', {
        root: false
      });
      const text = component.getComponent(SubmissionDownloadButton).text();
      text.should.equal('Download 2 Submissions…');
    });

    it('updates the draft checklist if the count changes', () => {
      testData.extendedForms.createPast(1);
      const draft = testData.extendedFormVersions
        .createPast(1, { draft: true, submissions: 0 })
        .last();
      testData.extendedSubmissions.createPast(1, { form: draft });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const steps = app.getComponent(FormDraftStatus)
            .findAllComponents(ChecklistStep);
          steps[1].props().stage.should.equal('current');
        })
        .load('/projects/1/forms/f/draft/testing', {
          project: false, form: false, formDraft: false, attachments: false
        })
        .complete()
        .route('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const steps = app.getComponent(FormDraftStatus)
            .findAllComponents(ChecklistStep);
          steps[1].props().stage.should.equal('complete');
        });
    });
  });

  describe('dataset preview box', () => {
    it('shows the dataset preview box', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
      const path = '/projects/1/forms/f/draft/testing';
      return load(path)
        .then(c => {
          c.find('.panel-dialog').exists().should.be.true;
        });
    });

    it('does not show the dataset preview box', async () => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
      const path = '/projects/1/forms/f/draft/testing';
      return load(path)
        .then(c => {
          c.find('.panel-dialog').exists().should.be.false;
        });
    });
  });
});
