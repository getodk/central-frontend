import DateTime from '../../../src/components/date-time.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';
import SubmissionUpdateReviewState from '../../../src/components/submission/update-review-state.vue';

import testData from '../../data';
import { loadSubmissionList } from '../../util/submission';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountComponent = (propsData = undefined) => mount(SubmissionMetadataRow, {
  propsData: {
    projectId: '1',
    xmlFormId: testData.extendedForms.last().xmlFormId,
    draft: false,
    submission: testData.submissionOData().value[0],
    rowNumber: 1,
    canUpdate: true,
    ...propsData
  },
  router: true
});

describe('SubmissionMetadataRow', () => {
  it('shows the row number', () => {
    testData.extendedForms.createPast(1, { submissions: 1000 });
    testData.extendedSubmissions.createPast(1);
    const td = mountComponent({ rowNumber: 1000 }).first('td');
    td.hasClass('row-number').should.be.true();
    td.text().trim().should.equal('1000');
  });

  describe('submitter name', () => {
    it('shows the submitter name for a form', () => {
      mockLogin({ displayName: 'Alice' });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent({ draft: false });
      const td = row.find('td')[1];
      td.hasClass('submitter-name').should.be.true();
      td.text().trim().should.equal('Alice');
      td.getAttribute('title').should.equal('Alice');
    });

    it('does not show the submitter name for a form draft', () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent({ draft: true });
      row.find('.submitter-name').length.should.equal(0);
    });
  });

  it('shows the submission date', () => {
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    mountComponent().first(DateTime).getProp('iso').should.equal(createdAt);
  });

  describe('state', () => {
    it('renders correctly for a review state that is null', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: null });
      const state = mountComponent().first('.state');
      state.find('.icon-dot-circle-o').length.should.equal(1);
      state.text().should.equal('Received');
    });

    it('renders correctly for a review state of hasIssues', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
      const state = mountComponent().first('.state');
      state.find('.icon-comments').length.should.equal(1);
      state.text().should.equal('Has issues');
    });

    it('renders correctly for a review state of edited', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'edited' });
      const state = mountComponent().first('.state');
      state.find('.icon-pencil').length.should.equal(1);
      state.text().should.equal('Edited');
    });

    it('renders correctly for a review state of approved', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'approved' });
      const state = mountComponent().first('.state');
      state.find('.icon-check-circle').length.should.equal(1);
      state.text().should.equal('Approved');
    });

    it('renders correctly for a review state of rejected', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'rejected' });
      const state = mountComponent().first('.state');
      state.find('.icon-times-circle').length.should.equal(1);
      state.text().should.equal('Rejected');
    });

    it('reports missing media if the review state is null', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsPresent: 0,
        attachmentsExpected: 1,
        reviewState: null
      });
      const state = mountComponent().first('.state');
      state.find('.icon-circle-o').length.should.equal(1);
      state.text().should.equal('Missing media');
    });

    it('does not report missing media if the review state is not null', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsPresent: 0,
        attachmentsExpected: 1,
        reviewState: 'approved'
      });
      const state = mountComponent().first('.state');
      state.find('.icon-check-circle').length.should.equal(1);
      state.text().should.equal('Approved');
    });
  });

  describe('edit count', () => {
    it('shows the count if there has been an edit', () => {
      testData.extendedSubmissions.createPast(1, { edits: 1000 });
      mountComponent().first('.edits').text().should.equal('1,000');
    });

    it('does not show the count if there has not been an edit', () => {
      testData.extendedSubmissions.createPast(1, { edits: 0 });
      mountComponent().find('.edits').length.should.equal(0);
    });
  });

  describe('review button', () => {
    beforeEach(mockLogin);

    it('toggles the modal', () => {
      testData.extendedSubmissions.createPast(1);
      return loadSubmissionList().testModalToggles({
        modal: SubmissionUpdateReviewState,
        show: '.submission-metadata-row .review-button',
        hide: '.btn-link'
      });
    });

    describe('after a successful response', () => {
      const submit = () => {
        testData.extendedSubmissions.createPast(1, {
          instanceId: 's',
          reviewState: null
        });
        return loadSubmissionList()
          .complete()
          .request(async (component) => {
            await trigger.click(component, '.submission-metadata-row .review-button');
            return trigger.submit(component, '#submission-update-review-state form', [
              ['input[value="hasIssues"]', true]
            ]);
          })
          .respondWithData(() => {
            testData.extendedSubmissions.update(-1, {
              reviewState: 'hasIssues'
            });
            return testData.standardSubmissions.last();
          });
      };

      it('hides the modal', async () => {
        const component = await submit();
        const modal = component.first(SubmissionUpdateReviewState);
        modal.getProp('state').should.be.false();
      });

      it('updates the submission', async () => {
        const component = await submit();
        const submission = component.data().submissions[0];
        submission.__system.reviewState.should.equal('hasIssues');
        // Check that other properties were copied correctly.
        submission.__id.should.equal('s');
        submission.__system.submitterId.should.equal('1');
      });
    });
  });

  describe('edit button', () => {
    it('sets the correct href attribute', () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a b',
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
      const href = mountComponent().find('.btn')[1].getAttribute('href');
      href.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/edit');
    });

    it('sets the correct title attribute', () => {
      testData.extendedSubmissions.createPast(1, { edits: 1000 });
      const title = mountComponent().find('.btn')[1].getAttribute('title');
      title.should.equal('Edit (1,000)');
    });

    it('disables the button if the submission is encrypted', () => {
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
      const button = mountComponent().find('.btn')[1];
      button.hasAttribute('disabled').should.be.true();
      const title = button.getAttribute('title');
      title.should.equal('You cannot edit encrypted Submissions.');
    });
  });

  it('sets the correct href attribute for the More button', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
    const href = mountComponent().find('.btn')[2].getAttribute('href');
    href.should.equal('#/projects/1/forms/a%20b/submissions/c%20d');
  });

  it('renders only the More button if the canUpdate prop is false', () => {
    mockLogin({ role: 'none' });
    testData.extendedProjects.createPast(1, { forms: 1, role: 'viewer' });
    testData.extendedSubmissions.createPast(1);
    const row = mountComponent({ canUpdate: false });
    row.find('.btn').length.should.equal(1);
  });

  it('does not render the "State and actions" column for a form draft', () => {
    testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
    testData.extendedSubmissions.createPast(1);
    const row = mountComponent({ draft: true });
    row.find('.state-and-actions').length.should.equal(0);
  });
});
