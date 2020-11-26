import ChecklistStep from '../../../src/components/checklist-step.vue';
import CollectQr from '../../../src/components/collect-qr.vue';
import EnketoFill from '../../../src/components/enketo/fill.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import FormDraftStatus from '../../../src/components/form-draft/status.vue';

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

  describe('SubmissionList props', () => {
    beforeEach(mockLogin);

    it('passes the correct baseUrl prop to SubmissionList', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft/testing', { component: true }, {})
        .then(component => {
          const baseUrl = component.first(SubmissionList).getProp('baseUrl');
          baseUrl.should.equal('/v1/projects/1/forms/f/draft');
        });
    });

    it('passes the form draft to SubmissionList', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
      return load('/projects/1/forms/f/draft/testing', { component: true }, {})
        .then(component => {
          const formVersion = component.first(SubmissionList)
            .getProp('formVersion');
          formVersion.version.should.equal('v2');
        });
    });
  });

  it('updates the draft checklist if the submission count changes', () => {
    mockLogin();
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
