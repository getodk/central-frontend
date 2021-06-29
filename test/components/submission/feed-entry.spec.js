import { RouterLinkStub } from '@vue/test-utils';

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
  stubs: { RouterLink: RouterLinkStub },
  mocks: { $route: '/projects/1/submissions/s' }
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

    it("shows a comment's body with rendered markdown", () => {
      testData.extendedComments.createPast(1, { body: 'Some **bold** comment' });
      const { outerHTML } = mountComponent().get('.body').element;
      outerHTML.should.equal('<div class="body"><p>Some <strong>bold</strong> comment</p>\n</div>');
    });

    it('shows a multi-line comment rendered on multiple lines', () => {
      testData.extendedComments.createPast(1, { body: 'Line 1\nLine 2' });
      const { outerHTML } = mountComponent().get('.body').element;
      outerHTML.should.equal('<div class="body"><p>Line 1<br>Line 2</p>\n</div>');
    });

    it('augments links to add target=_blank and open in new tab', () => {
      testData.extendedComments.createPast(1, { body: '[link](https://getodk.org)' });
      const { outerHTML } = mountComponent().get('.body').element;
      outerHTML.should.equal('<div class="body"><p><a href="https://getodk.org" target="_blank" rel="noreferrer noopener">link</a></p>\n</div>');
    });

    it('does allow raw html in markdown', () => {
      testData.extendedComments.createPast(1, { body: '<b>bold</b>' });
      const { outerHTML } = mountComponent().get('.body').element;
      outerHTML.should.equal('<div class="body"><p><b>bold</b></p>\n</div>');
    });

    it('removes script and svg tags and sanitizes html', () => {
      testData.extendedComments.createPast(1, { body: '<script>foo</script><svg>bar</svg>' });
      const { outerHTML } = mountComponent().get('.body').element;
      outerHTML.should.equal('<div class="body"></div>');
    });

    it('removes unwanted attributes', () => {
      testData.extendedComments.createPast(1, { body: '<b style="color: red;" class="c" data-foo="bar">foo</b>' });
      const { outerHTML } = mountComponent().get('.body').element;
      outerHTML.should.equal('<div class="body"><p><b>foo</b></p>\n</div>');
    });
  });
});
