import { RouterLinkStub } from '@vue/test-utils';

import SubmissionActivity from '../../../src/components/submission/activity.vue';
import SubmissionFeedEntry from '../../../src/components/submission/feed-entry.vue';
import SubmissionUpdateReviewState from '../../../src/components/submission/update-review-state.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { wait } from '../../util/util';

const mountComponent = () => {
  const project = testData.extendedProjects.last();
  const form = testData.extendedForms.last();
  const submission = testData.submissionOData();
  const audits = testData.extendedAudits.sorted();
  const comments = testData.extendedComments.sorted();
  const diffs = Object.create(null); // TODO: make this real extended data
  return mount(SubmissionActivity, {
    propsData: {
      projectId: '1',
      xmlFormId: form.xmlFormId,
      instanceId: submission.value[0].__id
    },
    requestData: { project, submission, audits, comments, diffs },
    stubs: { RouterLink: RouterLinkStub },
    mocks: { $route: '/projects/1/submissions/s' }
  });
};

describe('SubmissionActivity', () => {
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
        } else if (index === 4) {
          url.should.equal("/v1/projects/1/forms/a%20b/submissions/'c%20d'/diffs");
          headers['X-Extended-Metadata'].should.equal('true');
        }
      })
      .afterResponses(() => {
        count.should.equal(5);
      });
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
          .respondWithData(() => Object.create(null)); // TODO: replace with extendedDiffs
      };

      it('sends the correct requests for activity data', () =>
        submit().beforeEachResponse((_, { method, url, headers }, index) => {
          if (index === 0) return;
          method.should.equal('GET');
          if (index === 1) {
            url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/audits');
            headers['X-Extended-Metadata'].should.equal('true');
          } else if (index === 2) {
            url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/comments');
            headers['X-Extended-Metadata'].should.equal('true');
          } else if (index === 3) {
            url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/diffs');
            headers['X-Extended-Metadata'].should.equal('true');
          }
        }));

      it('hides the modal', async () => {
        const component = await submit();
        const modal = component.getComponent(SubmissionUpdateReviewState);
        modal.props().state.should.be.false();
      });

      it('shows a success alert', async () => {
        const component = await submit();
        component.should.alert('success');
      });

      it('updates the store', async () => {
        const component = await submit();
        const { submission } = component.vm.$store.state.request.data;
        submission.__system.reviewState.should.equal('hasIssues');
        // Check that other properties were copied correctly.
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
    entries.at(0).props().entry.body.should.equal('Comment 2');
    entries.at(1).props().entry.action.should.equal('submission.update.version');
    entries.at(2).props().entry.body.should.equal('Comment 1');
    entries.at(3).props().entry.action.should.equal('submission.create');
  });
});
