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
    const component = await load(path, { root: false });
    component.getComponent(EnketoFill).should.be.visible();
  });

  it('shows a QR code that encodes the correct settings', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { name: 'My Form', draft: true });
    const component = await load('/projects/1/forms/f/draft/testing', {
      root: false
    });
    const { draftToken } = testData.extendedFormDrafts.last();
    component.getComponent(CollectQr).props().settings.should.eql({
      general: {
        server_url: `http://localhost:9876/v1/test/${draftToken}/projects/1/forms/f/draft`,
        form_update_mode: 'match_exactly',
        autosend: 'wifi_and_cellular'
      },
      project: { name: '[Draft] My Form', icon: '📝' },
      admin: {}
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
        root: false
      });
      const dropdown = component.getComponent(SubmissionDownloadDropdown);
      dropdown.get('button').text().should.equal('Download 2 records');
    });

    it('updates the draft checklist if the count changes', () => {
      testData.extendedForms.createPast(1);
      const draft = testData.extendedFormVersions
        .createPast(1, { draft: true, submissions: 0 })
        .last();
      testData.extendedSubmissions.createPast(1, { form: draft });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const step = app.getComponent(FormDraftStatus)
            .findAllComponents(ChecklistStep)
            .at(1);
          step.props().stage.should.equal('current');
        })
        .load('/projects/1/forms/f/draft/testing', {
          project: false, form: false, formDraft: false, attachments: false
        })
        .complete()
        .route('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const step = app.getComponent(FormDraftStatus)
            .findAllComponents(ChecklistStep)
            .at(1);
          step.props().stage.should.equal('complete');
        });
    });
  });
});
