import ChecklistStep from '../../../src/components/checklist-step.vue';
import CollectQr from '../../../src/components/collect-qr.vue';
import EnketoFill from '../../../src/components/enketo/fill.vue';
import FormDraftStatus from '../../../src/components/form-draft/status.vue';
import SubmissionDownloadDropdown from '../../../src/components/submission/download-dropdown.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftTesting', () => {
  it('shows the New button', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { draft: true });
    const path = '/projects/1/forms/f/draft/testing';
    const component = await load(path, { component: true }, {});
    component.first(EnketoFill).should.be.visible();
  });

  it('shows a QR code that encodes the correct settings', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { draft: true });
    const component = await load(
      '/projects/1/forms/f/draft/testing',
      { component: true },
      {}
    );
    const { draftToken } = testData.extendedFormDrafts.last();
    component.first(CollectQr).getProp('settings').should.eql({
      server_url: `/v1/test/${draftToken}/projects/1/forms/f/draft`
    });
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
        component: true
      });
      const dropdown = component.first(SubmissionDownloadDropdown);
      dropdown.first('button').text().should.equal('Download 2 records');
    });

    it('updates the draft checklist if the count changes', () => {
      testData.extendedForms.createPast(1);
      const draft = testData.extendedFormVersions
        .createPast(1, { draft: true, submissions: 0 })
        .last();
      testData.extendedSubmissions.createPast(1, { form: draft });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const step = app.first(FormDraftStatus).find(ChecklistStep)[1];
          step.getProp('stage').should.equal('current');
        })
        .load('/projects/1/forms/f/draft/testing', {
          project: false, form: false, formDraft: false, attachments: false
        })
        .complete()
        .route('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const step = app.first(FormDraftStatus).find(ChecklistStep)[1];
          step.getProp('stage').should.equal('complete');
        });
    });
  });
});
