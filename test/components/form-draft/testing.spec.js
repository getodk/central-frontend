import ChecklistStep from '../../../src/components/checklist-step.vue';
import EnketoFill from '../../../src/components/enketo/fill.vue';
import FormDraftStatus from '../../../src/components/form-draft/status.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { collectQrData } from '../../util/collect-qr';
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

  it('shows a QR code that encodes the correct settings', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft/testing', { component: true }, {})
      .then(component => {
        // avoriaz can't seem to find the <img> element (maybe because we use
        // v-html?). We use a little vanilla JavaScript to find it ourselves.
        const span = component.first('#form-draft-testing-info .float-row span').element;
        span.children.length.should.equal(1);
        const img = span.children[0];
        img.tagName.should.equal('IMG');
        const { draftToken } = testData.extendedFormDrafts.last();
        collectQrData(img).should.eql({
          general: {
            server_url: `${window.location.origin}/v1/test/${draftToken}/projects/1/forms/f/draft`
          },
          admin: {}
        });
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
