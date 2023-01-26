import EnketoFill from '../../../src/components/enketo/fill.vue';
import SubmissionDownloadButton from '../../../src/components/submission/download-dropdown.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormSubmissions', () => {
  describe('new submission button', () => {
    it('shows the button to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      component.getComponent(EnketoFill).should.be.visible();
    });

    it('does not render the button for a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      component.findComponent(EnketoFill).exists().should.be.false();
    });
  });

  describe('submission count', () => {
    beforeEach(mockLogin);

    it('shows the count for the form, not the form draft', async () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      testData.extendedFormVersions.createPast(1, {
        draft: true,
        submissions: 2
      });
      testData.extendedSubmissions.createPast(1);
      const component = await load('/projects/1/forms/f/submissions', {
        root: false
      });
      const text = component.getComponent(SubmissionDownloadButton).text();
      text.should.equal('Download 1 Submission…');
    });

    it('updates the form overview if the count changes', () => {
      testData.extendedForms.createPast(1, { submissions: 10 });
      testData.extendedSubmissions.createPast(11);
      return load('/projects/1/forms/f')
        .afterResponses(app => {
          const item = app.get('#form-overview-right-now-submissions');
          item.get('.summary-item-heading').text().should.equal('10');
        })
        .load('/projects/1/forms/f/submissions', {
          project: false, form: false, formDraft: false, attachments: false
        })
        .complete()
        .route('/projects/1/forms/f')
        .then(app => {
          const item = app.get('#form-overview-right-now-submissions');
          item.get('.summary-item-heading').text().should.equal('11');
        });
    });
  });
});
