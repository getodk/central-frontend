import SubmissionAuditList from '../../../../src/components/submission/audit/list.vue';
import SubmissionAuditRow from '../../../../src/components/submission/audit/row.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => {
  const project = testData.extendedProjects.last();
  const form = testData.extendedForms.last();
  const submission = testData.submissionOData();
  const audits = testData.extendedAudits.sorted();
  return mount(SubmissionAuditList, {
    propsData: {
      projectId: '1',
      xmlFormId: form.xmlFormId,
      instanceId: submission.value[0].__id
    },
    requestData: { project, submission, audits },
    router: true
  });
};

describe('SubmissionAuditList', () => {
  it('sends the correct initial requests', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: "'c d'" });
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
        }
      })
      .afterResponses(() => {
        count.should.equal(3);
      });
  });

  describe('"Update State" button', () => {
    it('renders the button if the user can submission.update', () => {
      mockLogin({ role: 'admin' });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent();
      component.find('#submission-audit-list-update-review-state-button').length.should.equal(1);
    });

    it('does not render button if user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent();
      component.find('#submission-audit-list-update-review-state-button').length.should.equal(0);
    });
  });

  describe('Edit button', () => {
    it('renders the button if the user can submission.update', () => {
      mockLogin({ role: 'admin' });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent();
      component.find('#submission-audit-list-edit-button').length.should.equal(1);
    });

    it('does not render button if user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent();
      component.find('#submission-audit-list-edit-button').length.should.equal(0);
    });

    it('disables the button if the submission is encrypted', () => {
      mockLogin();
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
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
      const component = mountComponent();
      const btn = component.first('#submission-audit-list-edit-button');
      const href = btn.getAttribute('href');
      href.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/edit');
    });
  });

  it('filters the audit log entries', () => {
    mockLogin();
    testData.extendedSubmissions.createPast(1);
    testData.extendedAudits
      .createPast(1, { action: 'submission.create' })
      .createPast(1, {
        action: 'submission.update',
        details: { reviewState: 'hasIssues' }
      })
      .createPast(1, { action: 'submission.update.version' })
      // Filtered out
      .createPast(1, {
        action: 'submission.update',
        details: { reviewState: null }
      })
      .createPast(1, {
        action: 'submission.update',
        // No-op PATCH
        details: {}
      });
    const audits = mountComponent().find(SubmissionAuditRow)
      .map(row => row.getProp('audit'));
    audits.length.should.equal(2);
    audits[0].action.should.equal('submission.update.version');
    audits[1].action.should.equal('submission.update');
    should.exist(audits[1].details.reviewState);
  });

  it('shows a message if there are no audit log entries', () => {
    mockLogin();
    testData.extendedSubmissions.createPast(1);
    mountComponent().first('.empty-table-message').should.be.visible();
  });
});
