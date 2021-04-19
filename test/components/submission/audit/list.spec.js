import SubmissionAuditList from '../../../../src/components/submission/audit/list.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => {
  const project = testData.extendedProjects.last();
  const form = testData.extendedForms.last();
  const submission = testData.submissionOData();
  const audits = testData.extendedAudits.sorted();
  const comments = testData.extendedComments.sorted();
  return mount(SubmissionAuditList, {
    propsData: {
      projectId: '1',
      xmlFormId: form.xmlFormId,
      instanceId: submission.value[0].__id
    },
    requestData: { project, submission, audits, comments },
    router: true
  });
};

describe('SubmissionAuditList', () => {
  it('sends the correct initial requests', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: "'c d'" });
    testData.extendedAudits.createPast(1, { action: 'submission.create' });
    let count = 0;
    return load("/projects/1/forms/a%20b/submissions/'c%20d'")
      .beforeEachResponse((_, { method, url, headers }, index) => {
        count += 1;
        method.should.equal('GET');
        if (index === 0) {
          url.should.equal('/v1/projects/1');
          headers['X-Extended-Metadata'].should.equal('true');
        } else if (index === 1) {
          url.should.equal("/v1/projects/1/forms/a%20b.svc/Submissions('''c%20d''')");
        } else if (index === 2) {
          url.should.equal("/v1/projects/1/forms/a%20b/submissions/'c%20d'/audits");
          headers['X-Extended-Metadata'].should.equal('true');
        } else if (index === 3) {
          url.should.equal("/v1/projects/1/forms/a%20b/submissions/'c%20d'/comments");
          headers['X-Extended-Metadata'].should.equal('true');
        }
      })
      .afterResponses(() => {
        count.should.equal(4);
      });
  });

  describe('"Update State" button', () => {
    it('renders the button if the user can submission.update', () => {
      mockLogin({ role: 'admin' });
      testData.extendedSubmissions.createPast(1);
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      component.find('#submission-audit-list-update-review-state-button').length.should.equal(1);
    });

    it('does not render button if user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      component.find('#submission-audit-list-update-review-state-button').length.should.equal(0);
    });
  });

  describe('Edit button', () => {
    it('renders the button if the user can submission.update', () => {
      mockLogin({ role: 'admin' });
      testData.extendedSubmissions.createPast(1);
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      component.find('#submission-audit-list-edit-button').length.should.equal(1);
    });

    it('does not render button if user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      component.find('#submission-audit-list-edit-button').length.should.equal(0);
    });

    it('disables the button if the submission is encrypted', () => {
      mockLogin();
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      const btn = component.first('#submission-audit-list-edit-button');
      btn.hasAttribute('disabled').should.be.true();
      btn.getAttribute('title').should.equal('You cannot edit encrypted Submissions.');
    });

    it('sets the correct href attribute', () => {
      mockLogin();
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a b',
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      const btn = component.first('#submission-audit-list-edit-button');
      const href = btn.getAttribute('href');
      href.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/edit');
    });
  });
});
