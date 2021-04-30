import ActorLink from '../../../src/components/actor-link.vue';
import DateTime from '../../../src/components/date-time.vue';
import SubmissionFeedEntry from '../../../src/components/submission/feed-entry.vue';

import Audit from '../../../src/presenters/audit';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(SubmissionFeedEntry, {
  propsData: {
    entry: testData.extendedAudits.size !== 0
      ? new Audit(testData.extendedAudits.last())
      : testData.extendedComments.last()
  },
  router: true
});

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
      mountComponent().first(DateTime).getProp('iso').should.equal(loggedAt);
    });

    it('shows createdAt for a comment', () => {
      const { createdAt } = testData.extendedComments.createPast(1).last();
      mountComponent().first(DateTime).getProp('iso').should.equal(createdAt);
    });
  });

  it('shows the actor', () => {
    testData.extendedAudits.createPast(1, {
      actor: testData.extendedUsers.first(),
      action: 'submission.create'
    });
    const actorLink = mountComponent().first(ActorLink);
    actorLink.getProp('actor').displayName.should.equal('Alice');
  });

  describe('title', () => {
    it('renders correctly for a submission.create audit', () => {
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      const title = mountComponent().first('.title');
      title.find('.icon-cloud-upload').length.should.equal(1);
      title.text().should.equal('Submitted by Alice');
    });

    describe('submission.update audit', () => {
      it('renders correctly for null', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: null }
        });
        const title = mountComponent().first('.title');
        title.text().should.equal('Received per Alice');
        const reviewState = title.first('.review-state');
        reviewState.getAttribute('class').should.equal('review-state');
        reviewState.find('.icon-dot-circle-o').length.should.equal(1);
        reviewState.text().should.equal('Received');
      });

      it('renders correctly for hasIssues', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'hasIssues' }
        });
        const title = mountComponent().first('.title');
        title.text().should.equal('Has Issues per Alice');
        const reviewState = title.first('.review-state');
        reviewState.hasClass('hasIssues').should.be.true();
        reviewState.find('.icon-comments').length.should.equal(1);
        reviewState.text().should.equal('Has Issues');
      });

      it('renders correctly for edited', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'edited' }
        });
        const title = mountComponent().first('.title');
        title.text().should.equal('Edited by Alice');
        const reviewState = title.first('.review-state');
        reviewState.hasClass('edited').should.be.true();
        reviewState.find('.icon-pencil').length.should.equal(1);
        reviewState.text().should.equal('Edited');
      });

      it('renders correctly for approved', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'approved' }
        });
        const title = mountComponent().first('.title');
        title.text().should.equal('Approved by Alice');
        const reviewState = title.first('.review-state');
        reviewState.hasClass('approved').should.be.true();
        reviewState.find('.icon-check-circle').length.should.equal(1);
        reviewState.text().should.equal('Approved');
      });

      it('renders correctly for rejected', () => {
        testData.extendedAudits.createPast(1, {
          action: 'submission.update',
          details: { reviewState: 'rejected' }
        });
        const title = mountComponent().first('.title');
        title.text().should.equal('Rejected by Alice');
        const reviewState = title.first('.review-state');
        reviewState.hasClass('rejected').should.be.true();
        reviewState.find('.icon-times-circle').length.should.equal(1);
        reviewState.text().should.equal('Rejected');
      });
    });

    it('renders correctly for a submission.update.version audit', () => {
      testData.extendedAudits.createPast(1, {
        action: 'submission.update.version'
      });
      const title = mountComponent().first('.title');
      title.text().should.equal('Edited by Alice');
      const reviewState = title.first('.review-state');
      reviewState.hasClass('edited').should.be.true();
      reviewState.find('.icon-pencil').length.should.equal(1);
      reviewState.text().should.equal('Edited');
    });

    it('renders correctly for a comment', () => {
      testData.extendedComments.createPast(1);
      const title = mountComponent().first('.title');
      title.find('.icon-comment').length.should.equal(1);
      title.text().should.equal('Comment by Alice');
    });
  });

  describe('body', () => {
    it("shows an audit's notes", () => {
      testData.extendedAudits.createPast(1, {
        action: 'submission.update',
        details: { reviewState: 'approved' },
        notes: 'Some notes'
      });
      mountComponent().first('.body').text().should.equal('Some notes\n');
    });

    it("shows a comment's body", () => {
      testData.extendedComments.createPast(1, { body: 'Some comment' });
      mountComponent().first('.body').text().should.equal('Some comment\n');
    });

    it("shows a comment's body with rendered markdown", () => {
      testData.extendedComments.createPast(1, { body: 'Some **bold** comment' });
      mountComponent().first('.body').html().should.equal('<div class="body"><p>Some <strong>bold</strong> comment</p>\n</div>');
    });

    it('shows a multi-line comment rendered on multiple lines', () => {
      testData.extendedComments.createPast(1, { body: 'Line 1\nLine 2' });
      mountComponent().first('.body').text().should.equal('Line 1\nLine 2\n');
    });

    it('augments links to add target=_blank and open in new tab', () => {
      testData.extendedComments.createPast(1, { body: '[link](https://getodk.org)' });
      mountComponent().first('.body').html().should.equal('<div class="body"><p><a href="https://getodk.org" target="_blank" rel="noreferrer noopener">link</a></p>\n</div>');
    });

    it('does not allow raw html in markdown', () => {
      testData.extendedComments.createPast(1, { body: '<b>bold</b>' });
      mountComponent().first('.body').html().should.equal('<div class="body"><p>&lt;b&gt;bold&lt;/b&gt;</p>\n</div>');
    });
  });
});
