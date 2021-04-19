import DateTime from '../../../../src/components/date-time.vue';
import SubmissionAuditRow from '../../../../src/components/submission/audit/row.vue';

import Audit from '../../../../src/presenters/audit';

import testData from '../../../data';
import { mockLogin } from '../../../util/session';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(SubmissionAuditRow, {
  propsData: { audit: new Audit(testData.extendedAudits.last()) }
});

describe('SubmissionAuditRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
    testData.extendedSubmissions.createPast(1);
  });

  it('shows loggedAt', () => {
    const { loggedAt } = testData.extendedAudits
      .createPast(1, { action: 'submission.create' })
      .last();
    mountComponent().first(DateTime).getProp('iso').should.equal(loggedAt);
  });

  it('shows the actor', () => {
    testData.extendedAudits.createPast(1, { action: 'submission.create' });
    const span = mountComponent().first('.actor span');
    span.text().should.equal('Alice');
    span.getAttribute('title').should.equal('Alice');
  });

  describe('action column', () => {
    it('renders correctly for submission.create', () => {
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const action = mountComponent().first('.action');
      action.find('.icon-cloud-upload').length.should.equal(1);
      action.text().trim().should.equal('Submitted');
    });

    describe('submission.update of reviewState', () => {
      it('renders correctly for null', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: null }
        });
        const action = mountComponent().first('.action');
        action.find('.icon-dot-circle-o').length.should.equal(1);
        action.text().trim().should.equal('Received');
      });

      it('renders correctly for hasIssues', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'hasIssues' }
        });
        const action = mountComponent().first('.action');
        action.find('.icon-comments').length.should.equal(1);
        action.text().trim().should.equal('Has issues');
      });

      it('renders correctly for edited', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'edited' }
        });
        const action = mountComponent().first('.action');
        action.find('.icon-pencil').length.should.equal(1);
        action.text().trim().should.equal('Edited');
      });

      it('renders correctly for approved', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'approved' }
        });
        const action = mountComponent().first('.action');
        action.find('.icon-check-circle').length.should.equal(1);
        action.text().trim().should.equal('Approved');
      });

      it('renders correctly for rejected', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'rejected' }
        });
        const action = mountComponent().first('.action');
        action.find('.icon-times-circle').length.should.equal(1);
        action.text().trim().should.equal('Rejected');
      });
    });

    it('renders correctly for submission.update.version', () => {
      testData.extendedAudits.createPast(1, {
        action: 'submission.update.version'
      });
      const action = mountComponent().first('.action');
      action.find('.icon-pencil').length.should.equal(1);
      action.text().trim().should.equal('Edited');
    });
  });

  it('shows notes', () => {
    testData.extendedAudits.createPast(1, {
      action: 'submission.update',
      details: { reviewState: 'approved' },
      notes: 'Some notes'
    });
    mountComponent().first('.notes').text().should.equal('Some notes');
  });
});
