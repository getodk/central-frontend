import SubmissionActivity from '../../../src/components/submission/activity.vue';
import SubmissionFeedEntry from '../../../src/components/submission/feed-entry.vue';
import SubmissionUpdateReviewState from '../../../src/components/submission/update-review-state.vue';

import useFields from '../../../src/request-data/fields';
import useSubmission from '../../../src/request-data/submission';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';
import { wait } from '../../util/util';

const mountComponent = () => {
  const project = testData.extendedProjects.last();
  const form = testData.extendedForms.last();
  const submission = testData.submissionOData();
  const fields = form._fields;
  const audits = testData.extendedAudits.sorted();
  const comments = testData.extendedComments.sorted();
  const diffs = {};
  return mount(SubmissionActivity, {
    props: {
      projectId: '1',
      xmlFormId: form.xmlFormId,
      instanceId: submission.value[0].__id
    },
    container: {
      router: mockRouter('/projects/1/submissions/s'),
      requestData: testRequestData(
        [useSubmission, useFields],
        { project, submission, audits, comments, diffs, fields }
      )
    }
  });
};

describe('SubmissionActivity', () => {
  it('sends the correct initial requests', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: "'c d'" });
    testData.extendedAudits.createPast(1, { action: 'submission.create' });
    return load("/projects/1/forms/a%20b/submissions/'c%20d'").testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: "/v1/projects/1/forms/a%20b.svc/Submissions('''c%20d''')" },
      { url: "/v1/projects/1/forms/a%20b/submissions/'c%20d'/versions/'c%20d'" },
      { url: '/v1/projects/1/forms/a%20b/fields' },
      { url: "/v1/projects/1/forms/a%20b/submissions/'c%20d'/audits", extended: true },
      { url: "/v1/projects/1/forms/a%20b/submissions/'c%20d'/comments", extended: true },
      { url: "/v1/projects/1/forms/a%20b/submissions/'c%20d'/diffs" }
    ]);
  });

  describe('review button', () => {
    it('toggles the modal', () => {
      mockLogin();
      testData.extendedSubmissions.createPast(1, { instanceId: 's' });
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      return load('/projects/1/forms/f/submissions/s', { root: false })
        .testModalToggles({
          modal: SubmissionUpdateReviewState,
          show: '#submission-activity-update-review-state-button',
          hide: '.btn-link'
        });
    });

    it('does not render button if user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      component.find('#submission-activity-update-review-state-button').exists().should.be.false();
    });

    describe('after a successful response', () => {
      const submit = () => {
        mockLogin();
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        testData.extendedSubmissions.createPast(1, {
          instanceId: 'c d',
          reviewState: null
        });
        testData.extendedAudits.createPast(1, { action: 'submission.create' });
        return load('/projects/1/forms/a%20b/submissions/c%20d', { root: false })
          .complete()
          .request(async (component) => {
            const button = component.get('#submission-activity-update-review-state-button');
            await button.trigger('click');
            const modal = component.getComponent(SubmissionUpdateReviewState);
            await modal.get('input[value="hasIssues"]').setChecked();
            return modal.get('form').trigger('submit');
          })
          .respondWithData(() => {
            testData.extendedSubmissions.update(-1, { reviewState: 'hasIssues' });
            testData.extendedAudits.createPast(1, {
              action: 'submission.update',
              details: { reviewState: 'hasIssues' }
            });
            return testData.standardSubmissions.last();
          })
          .respondWithData(() => testData.extendedAudits.sorted())
          .respondWithData(() => testData.extendedComments.sorted())
          .respondWithData(() => ({}));
      };

      it('sends the correct requests for activity data', () =>
        submit().testRequests([
          null,
          { url: '/v1/projects/1/forms/a%20b/submissions/c%20d/audits', extended: true },
          { url: '/v1/projects/1/forms/a%20b/submissions/c%20d/comments', extended: true },
          { url: '/v1/projects/1/forms/a%20b/submissions/c%20d/diffs' }
        ]));

      it('hides the modal', async () => {
        const component = await submit();
        const modal = component.getComponent(SubmissionUpdateReviewState);
        modal.props().state.should.be.false();
      });

      it('shows a success alert', async () => {
        const component = await submit();
        component.should.alert('success');
      });

      it('updates the submission resource', async () => {
        const component = await submit();
        const { submission } = component.vm;
        submission.__system.reviewState.should.equal('hasIssues');
        // Check that the rest of the submission is intact.
        submission.__id.should.equal('c d');
        submission.__system.submitterId.should.equal('1');
      });

      it('updates the number of entries in the feed', async () => {
        const component = await submit();
        component.findAllComponents(SubmissionFeedEntry).length.should.equal(2);
      });
    });
  });

  describe('edit button', () => {
    it('renders the button if the user can submission.update', () => {
      mockLogin({ role: 'admin' });
      testData.extendedSubmissions.createPast(1);
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      component.find('#submission-activity-edit-button').exists().should.be.true();
    });

    it('does not render button if user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      component.find('#submission-activity-edit-button').exists().should.be.false();
    });

    it('disables the button if the submission is encrypted', () => {
      mockLogin();
      testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const component = mountComponent();
      const btn = component.get('#submission-activity-edit-button');
      btn.element.disabled.should.be.true();
      btn.attributes().title.should.equal('You cannot edit encrypted Submissions.');
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
      const btn = component.get('#submission-activity-edit-button');
      const { href } = btn.attributes();
      href.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/edit');
    });
  });

  it('sorts the feed', async () => {
    mockLogin();
    testData.extendedSubmissions.createNew();
    testData.extendedAudits.createNew({ action: 'submission.create' });
    await wait(1);
    testData.extendedComments.createNew({ body: 'Comment 1' });
    await wait(1);
    testData.extendedAudits.createNew({ action: 'submission.update.version' });
    await wait(1);
    testData.extendedComments.createNew({ body: 'Comment 2' });
    const entries = mountComponent().findAllComponents(SubmissionFeedEntry);
    entries.length.should.equal(4);
    entries[0].props().entry.body.should.equal('Comment 2');
    entries[1].props().entry.action.should.equal('submission.update.version');
    entries[2].props().entry.body.should.equal('Comment 1');
    entries[3].props().entry.action.should.equal('submission.create');
  });
});
