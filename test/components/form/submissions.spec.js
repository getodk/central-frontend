import EnketoFill from '../../../src/components/enketo/fill.vue';
import SubmissionDownloadDropdown from '../../../src/components/submission/download-dropdown.vue';

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
      const dropdown = component.getComponent(SubmissionDownloadDropdown);
      dropdown.get('button').text().should.equal('Download 1 record');
    });

    it('updates the form checklist if the count changes', () => {
      testData.extendedForms.createPast(1, { submissions: 10 });
      testData.extendedSubmissions.createPast(11);
      return load('/projects/1/forms/f')
        .afterResponses(app => {
          const step = app.findAll('#form-checklist .checklist-step').at(1);
          const text = step.findAll('p').at(1).text();
          text.should.containEql('10 ');
          text.should.not.containEql('11 ');
        })
        .load('/projects/1/forms/f/submissions', {
          project: false, form: false, formDraft: false, attachments: false
        })
        .complete()
        .route('/projects/1/forms/f')
        .then(app => {
          const step = app.findAll('#form-checklist .checklist-step').at(1);
          const text = step.findAll('p').at(1).text();
          text.should.containEql('11 ');
          text.should.not.containEql('10 ');
        });
    });
  });
});
