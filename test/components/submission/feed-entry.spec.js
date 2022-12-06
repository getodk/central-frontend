import ActorLink from '../../../src/components/actor-link.vue';
import DateTime from '../../../src/components/date-time.vue';
import MarkdownView from '../../../src/components/markdown/view.vue';
import SubmissionFeedEntry from '../../../src/components/submission/feed-entry.vue';

import useFields from '../../../src/request-data/fields';
import useSubmission from '../../../src/request-data/submission';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(SubmissionFeedEntry, mergeMountOptions(options, {
    props: {
      projectId: '1',
      xmlFormId: testData.extendedForms.last().xmlFormId,
      instanceId: 's',
      entry: testData.extendedAudits.size !== 0
        ? testData.extendedAudits.last()
        : testData.extendedComments.last()
    },
    container: {
      router: mockRouter('/projects/1/submissions/s'),
      requestData: testRequestData([useSubmission, useFields], {
        diffs: {},
        fields: testData.extendedForms.last()._fields
      })
    }
  }));

describe('SubmissionFeedEntry', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
    testData.extendedSubmissions.createPast(1);
  });

  describe('time', () => {
    it('shows loggedAt for an audit', () => {
      const { loggedAt } = testData.extendedAudits
        .createPast(1, { action: 'submission.create' })
        .last();
      mountComponent().getComponent(DateTime).props().iso.should.equal(loggedAt);
    });

    it('shows createdAt for a comment', () => {
      const { createdAt } = testData.extendedComments.createPast(1).last();
      mountComponent().getComponent(DateTime).props().iso.should.equal(createdAt);
    });
  });

  it('shows the actor', () => {
    testData.extendedAudits.createPast(1, {
      actor: testData.extendedUsers.first(),
      action: 'submission.create'
    });
    const actorLink = mountComponent().getComponent(ActorLink);
    actorLink.props().actor.displayName.should.equal('Alice');
  });

  describe('title', () => {
    it('renders correctly for a submission.create audit', () => {
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const title = mountComponent().get('.title');
      title.find('.icon-cloud-upload').exists().should.be.true();
      title.text().should.equal('Submitted by Alice');
    });

    describe('submission.update audit', () => {
      it('renders correctly for null', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: null }
        });
        const title = mountComponent().get('.title');
        title.text().should.equal('Received per Alice');
        const reviewState = title.get('.review-state');
        reviewState.attributes().class.should.equal('review-state');
        reviewState.find('.icon-dot-circle-o').exists().should.be.true();
        reviewState.text().should.equal('Received');
      });

      it('renders correctly for hasIssues', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'hasIssues' }
        });
        const title = mountComponent().get('.title');
        title.text().should.equal('Has Issues per Alice');
        const reviewState = title.get('.review-state');
        reviewState.classes('hasIssues').should.be.true();
        reviewState.find('.icon-comments').exists().should.be.true();
        reviewState.text().should.equal('Has Issues');
      });

      it('renders correctly for edited', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'edited' }
        });
        const title = mountComponent().get('.title');
        title.text().should.equal('Edited by Alice');
        const reviewState = title.get('.review-state');
        reviewState.classes('edited').should.be.true();
        reviewState.find('.icon-pencil').exists().should.be.true();
        reviewState.text().should.equal('Edited');
      });

      it('renders correctly for approved', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'approved' }
        });
        const title = mountComponent().get('.title');
        title.text().should.equal('Approved by Alice');
        const reviewState = title.get('.review-state');
        reviewState.classes('approved').should.be.true();
        reviewState.find('.icon-check-circle').exists().should.be.true();
        reviewState.text().should.equal('Approved');
      });

      it('renders correctly for rejected', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'rejected' }
        });
        const title = mountComponent().get('.title');
        title.text().should.equal('Rejected by Alice');
        const reviewState = title.get('.review-state');
        reviewState.classes('rejected').should.be.true();
        reviewState.find('.icon-times-circle').exists().should.be.true();
        reviewState.text().should.equal('Rejected');
      });
    });

    it('renders correctly for a submission.update.version audit', () => {
      testData.extendedAudits.createPast(1, {
        action: 'submission.update.version'
      });
      const title = mountComponent().get('.title');
      title.text().should.equal('Edited by Alice');
      const reviewState = title.get('.review-state');
      reviewState.classes('edited').should.be.true();
      reviewState.find('.icon-pencil').exists().should.be.true();
      reviewState.text().should.equal('Edited');
    });

    it('renders correctly for a comment', () => {
      testData.extendedComments.createPast(1);
      const title = mountComponent().get('.title');
      title.find('.icon-comment').exists().should.be.true();
      title.text().should.equal('Comment by Alice');
    });

    describe('entity.create audit', () => {
      it('renders correctly for newly created entity with ideally formatted details', () => {
        testData.extendedAudits.createPast(1, {
          action: 'entity.create',
          details: { entity: { uuid: 'xyz', label: 'EntityName', dataset: 'DatasetName' } }
        });
        const title = mountComponent().get('.title');
        title.text().should.equal('Created Entity EntityName in DatasetName Dataset');
      });

      it('renders okay and does not crash for action where entity details are missing', () => {
        testData.extendedAudits.createPast(1, {
          action: 'entity.create',
          details: { entity: { uuid: 'xyz' } }
        });
        const title = mountComponent().get('.title');
        title.text().should.equal('Created Entity  in  Dataset');
      });
    });

    describe('entity.create.error audit', () => {
      it('renders entity creation error message and help text', () => {
        testData.extendedAudits.createPast(1, {
          action: 'entity.create.error',
          details: { problem: { problemCode: 409.14, problemDetails: { reason: 'ID empty or missing.' } } }
        });
        const title = mountComponent().get('.title');
        title.get('.submission-feed-entry-entity-error').text().should.equal('Problem creating Entity');
        title.get('.entity-error-message').text().should.equal('ID empty or missing.');
        title.get('.entity-error-message').attributes().title.should.equal('ID empty or missing.');
      });
    });
  });

  describe('body', () => {
    it("shows an audit's notes", () => {
      testData.extendedAudits.createPast(1, {
        action: 'submission.update',
        details: { reviewState: 'approved' },
        notes: 'Some notes'
      });
      mountComponent().get('.body').text().should.equal('Some notes');
    });

    it("shows a comment's body", () => {
      testData.extendedComments.createPast(1, { body: 'Some comment' });
      mountComponent().get('.body').text().should.equal('Some comment');
    });

    it("shows a comment's body rendered as markdown", () => {
      testData.extendedComments.createPast(1, { body: 'this is **bold**' });
      const preview = mountComponent().getComponent(MarkdownView);
      preview.props().rawMarkdown.should.equal('this is **bold**');
      preview.get('div > p').html().should.equal('<p>this is <strong>bold</strong></p>');
    });
  });

  describe('diffs', () => {
    beforeEach(() => {
      // This form with fields is needed to set requestData.fields
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a',
        fields: [testData.fields.string('/name'), testData.fields.string('/age'), testData.fields.binary('/photo')]
      });

      // Diffs attach to audits with the same details.instanceId
      testData.extendedAudits.createPast(1, {
        action: 'submission.update.version',
        details: { instanceId: '1234' }
      });
    });

    it('shows diffs joined with a submission.update.version audit event', () => {
      const component = mountComponent({
        container: {
          requestData: {
            diffs: {
              1234: [
                {
                  new: 'Benny',
                  old: 'Berry',
                  path: ['name']
                },
                {
                  new: '17',
                  old: '15',
                  path: ['age']
                }
              ]
            }
          }
        }
      });

      // Two SubmissionDiffItem components should be present
      component.findAll('.submission-diff-item.outer-item').length.should.equal(2);
    });

    it('does not show changes to instanceID and deprecatedID', () => {
      const component = mountComponent({
        container: {
          requestData: {
            diffs: {
              1234: [
                {
                  new: 'Benny',
                  old: 'Berry',
                  path: ['name']
                },
                {
                  new: '1234',
                  old: '1111',
                  path: ['meta', 'instanceID']
                },
                {
                  new: '1111',
                  path: ['meta', 'deprecatedID']
                }
              ]
            }
          }
        }
      });

      const diffItems = component.findAll('.submission-diff-item.outer-item');
      diffItems.length.should.equal(1);
      diffItems[0].get('.data-new').text().should.equal('Benny');
    });

    it('uses deprecatedID to create media download links', () => {
      // The deprecatedID is used to build the media download link to an
      // attachment in the old version of the submission.
      // The audit.details.instanceID (key into diffs dict) is used to build
      // the link for the new version of the submission.
      const component = mountComponent({
        container: {
          requestData: {
            diffs: {
              1234: [
                {
                  new: 'new_file.jpg',
                  old: 'old_file.jpg',
                  path: ['photo']
                },
                {
                  new: '1111',
                  path: ['meta', 'deprecatedID']
                }
              ]
            }
          }
        }
      });

      const diffItem = component.findAll('.submission-diff-item.outer-item')[0];
      diffItem.get('.data-old').text().should.equal('old_file.jpg');
      diffItem.get('.data-old > a').attributes('href').should.equal('/v1/projects/1/forms/a/submissions/s/versions/1111/attachments/old_file.jpg');
      diffItem.get('.data-new').text().should.equal('new_file.jpg');
      diffItem.get('.data-new > a').attributes('href').should.equal('/v1/projects/1/forms/a/submissions/s/versions/1234/attachments/new_file.jpg');
    });
  });
});
