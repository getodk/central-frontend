import EnketoFill from '../../../src/components/enketo/fill.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormSubmissions', () => {
  describe('new submission button', () => {
    it('shows the button to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1);
      const path = '/projects/1/forms/f/submissions';
      const component = await load(path, { component: true }, {});
      component.first(EnketoFill).should.be.visible();
    });

    it('does not render the button for a project viewer', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1);
      const path = '/projects/1/forms/f/submissions';
      const component = await load(path, { component: true }, {});
      component.find(EnketoFill).length.should.equal(0);
    });
  });

  describe('SubmissionList props', () => {
    beforeEach(mockLogin);

    it('passes the correct baseUrl prop to SubmissionList', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/submissions', { component: true }, {})
        .then(component => {
          const baseUrl = component.first(SubmissionList).getProp('baseUrl');
          baseUrl.should.equal('/v1/projects/1/forms/f');
        });
    });

    it('passes the form to SubmissionList', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
      return load('/projects/1/forms/f/submissions', { component: true }, {})
        .then(component => {
          const formVersion = component.first(SubmissionList)
            .getProp('formVersion');
          formVersion.version.should.equal('v1');
        });
    });
  });

  it('updates the form checklist if the submission count changes', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { submissions: 10 });
    testData.extendedSubmissions.createPast(11);
    return load('/projects/1/forms/f')
      .afterResponses(app => {
        const p = app.find('#form-checklist .checklist-step')[1].find('p')[1];
        p.text().should.containEql('10 ');
        p.text().should.not.containEql('11 ');
      })
      .load('/projects/1/forms/f/submissions', {
        project: false, form: false, formDraft: false, attachments: false
      })
      .complete()
      .route('/projects/1/forms/f')
      .then(app => {
        const p = app.find('#form-checklist .checklist-step')[1].find('p')[1];
        p.text().should.containEql('11 ');
        p.text().should.not.containEql('10 ');
      });
  });
});
