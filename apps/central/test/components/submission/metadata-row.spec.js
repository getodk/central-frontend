import { RouterLinkStub } from '@vue/test-utils';

import DateTime from '../../../src/components/date-time.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';
import SubmissionUpdateReviewState from '../../../src/components/submission/update-review-state.vue';
import SubmissionReviewState from '../../../src/components/submission/review-state.vue';

import testData from '../../data';
import { loadSubmissionList } from '../../util/submission';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = (props = undefined) => {
  const form = testData.extendedForms.last();
  const { xmlFormId } = form;
  const mergedProps = {
    projectId: '1',
    xmlFormId,
    draft: false,
    submission: props?.deleted ? testData.submissionDeletedOData().value[0] : testData.submissionOData().value[0],
    rowNumber: 1,
    verbs: new Set(testData.extendedUsers.first().verbs),
    ...props
  };
  return mount(SubmissionMetadataRow, {
    props: mergedProps,
    container: {
      router: mockRouter(!mergedProps.draft
        ? `/projects/1/forms/${encodeURIComponent(xmlFormId)}/submissions`
        : `/projects/1/forms/${encodeURIComponent(xmlFormId)}/draft`),
      requestData: { project: testData.extendedProjects.last(), form }
    }
  });
};

describe('SubmissionMetadataRow', () => {
  it('shows the row number', () => {
    testData.extendedForms.createPast(1, { submissions: 1000 });
    testData.extendedSubmissions.createPast(1);
    const td = mountComponent({ rowNumber: 1000 }).get('td');
    td.classes('row-number').should.be.true;
    td.text().should.equal('1000');
  });

  describe('submitter name', () => {
    it('shows the submitter name for a form', async () => {
      mockLogin({ displayName: 'Alice Allison' });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent({ draft: false });
      const td = row.findAll('td')[1];
      td.classes('submitter-name').should.be.true;
      td.text().should.equal('Alice Allison');
      await td.get('span').should.have.textTooltip();
    });

    it('does not show the submitter name for a form draft', () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent({ draft: true });
      row.find('.submitter-name').exists().should.be.false;
    });
  });

  it('shows the submission date', () => {
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    mountComponent().getComponent(DateTime).props().iso.should.equal(createdAt);
  });

  describe('state', () => {
    it('shows the review state', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
      const state = mountComponent().get('.state');
      const { value } = state.getComponent(SubmissionReviewState).props();
      value.should.equal('hasIssues');
    });

    it('reports a missing attachment if the review state is null', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsPresent: 0,
        attachmentsExpected: 1,
        reviewState: null
      });
      const state = mountComponent().get('.state');
      state.find('.icon-circle-o').exists().should.be.true;
      state.text().should.equal('Missing Attachment');
      state.findComponent(SubmissionReviewState).exists().should.be.false;
    });

    it('does not report a missing attachment if review state is not null', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsPresent: 0,
        attachmentsExpected: 1,
        reviewState: 'approved'
      });
      const state = mountComponent().get('.state');
      const { value } = state.getComponent(SubmissionReviewState).props();
      value.should.equal('approved');
    });
  });

  describe('edit count', () => {
    it('shows the count if there has been an edit', () => {
      testData.extendedSubmissions.createPast(1, { edits: 1000 });
      mountComponent().get('.edits').text().should.equal('1,000');
    });

    it('does not show the count if there has not been an edit', () => {
      testData.extendedSubmissions.createPast(1, { edits: 0 });
      mountComponent().get('.edits').text().should.equal('');
    });
  });

  it('shows the delete button', async () => {
    testData.extendedSubmissions.createPast(1);
    mountComponent().find('.delete-button').attributes('aria-label').should.be.equal('Delete');
  });

  it('does not show the delete button if user does not have submission delete permission', async () => {
    mockLogin({ role: 'none' });
    testData.extendedProjects.createPast(1, { role: 'viewer' });
    testData.extendedSubmissions.createPast(1);
    mountComponent().find('.delete-button').exists().should.be.false;
  });

  it('shows the restore button', async () => {
    testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
    mountComponent({ deleted: true }).find('.restore-button').attributes('aria-label').should.be.equal('Restore');
  });

  it('does not show the restore button if user does not have submission restore permission', async () => {
    mockLogin({ role: 'none' });
    testData.extendedProjects.createPast(1, { role: 'viewer' });
    testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
    mountComponent({ deleted: true }).find('.restore-button').exists().should.be.false;
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
          instanceId: 'foo',
          reviewState: null
        });
        return loadSubmissionList()
          .complete()
          .request(async (component) => {
            await component.get('.submission-metadata-row .review-button').trigger('click');
            const modal = component.getComponent(SubmissionUpdateReviewState);
            await modal.get('input[value="hasIssues"]').setValue(true);
            return modal.get('form').trigger('submit');
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
        const modal = component.getComponent(SubmissionUpdateReviewState);
        modal.props().state.should.be.false;
      });

      it('shows a success alert', async () => {
        const component = await submit();
        component.should.alert('success');
      });

      it('updates the submission', async () => {
        const component = await submit();
        const submission = component.vm.odata.value[0];
        submission.__system.reviewState.should.equal('hasIssues');
        // Check that other properties were copied correctly.
        submission.__id.should.equal('foo');
        submission.__system.submitterId.should.equal('1');
      });
    });
  });

  describe('edit button', () => {
    it('sets the correct href attribute', async () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a b',
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
      const { href } = mountComponent().findAll('.btn')[2].attributes();
      href.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/edit');
    });

    it('sets the correct ARIA label', async () => {
      testData.extendedSubmissions.createPast(1, { edits: 1000 });
      const btn = mountComponent().findAll('.btn')[2];
      btn.attributes('aria-label').should.equal('Edit (1,000)');
      await btn.should.have.tooltip('Edit (1,000)');
    });

    it('disables the button if the submission is encrypted', async () => {
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
      const button = mountComponent().findAll('.btn')[2];
      button.attributes('aria-disabled').should.equal('true');
      button.should.have.ariaDescription('You cannot edit encrypted Submissions.');
      await button.should.have.tooltip('You cannot edit encrypted Submissions.');
    });
  });

  it('specifies the correct to prop for the More button', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
    const { to } = mountComponent().getComponent(RouterLinkStub).props();
    to.should.equal('/projects/1/forms/a%20b/submissions/c%20d');
  });

  it('renders only the More button if user does not have update and delete permission', () => {
    mockLogin({ role: 'none' });
    testData.extendedProjects.createPast(1, { forms: 1, role: 'viewer' });
    testData.extendedSubmissions.createPast(1);
    const row = mountComponent({ canUpdate: false });
    // Selecting this way because RouterLinkStub doesn't use the scoped slot.
    row.findAll('.btn-group > *').length.should.equal(1);
  });

  it('does not render the "State and actions" column for a form draft', () => {
    testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
    testData.extendedSubmissions.createPast(1);
    const row = mountComponent({ draft: true });
    row.find('.state-and-actions').exists().should.be.false;
  });

  describe('deleted', () => {
    it('shows the deleted date', () => {
      const { deletedAt } = testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() }).last();
      mountComponent({ deleted: true }).get('.state-and-actions').getComponent(DateTime).props().iso.should.equal(deletedAt);
    });

    it('does not have delete button', () => {
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() }).last();
      mountComponent({ deleted: true }).find('.delete-button').exists().should.be.false;
    });

    it('shows restore button', () => {
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() }).last();
      mountComponent({ deleted: true }).find('.restore-button').attributes('aria-label').should.be.equal('Restore');
    });
  });
});
