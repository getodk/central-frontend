import DateTime from '../../../src/components/date-time.vue';
import SubmissionBasicDetails from '../../../src/components/submission/basic-details.vue';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(SubmissionBasicDetails, {
  requestData: { submission: testData.submissionOData() },
  router: true
});

describe('SubmissionBasicDetails', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('shows the instance ID', () => {
    testData.extendedSubmissions.createPast(1, { instanceId: 'foo' });
    const span = mountComponent().first('dd span');
    span.text().should.equal('foo');
    span.getAttribute('title').should.equal('foo');
  });

  it('shows the submitter', () => {
    testData.extendedSubmissions.createPast(1, {
      submitter: testData.extendedUsers.first()
    });
    const span = mountComponent().find('dd')[1].first('span');
    span.text().should.equal('Alice');
    span.getAttribute('title').should.equal('Alice');
  });

  it('shows the submission date', () => {
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    mountComponent().first(DateTime).getProp('iso').should.equal(createdAt);
  });

  describe('review state', () => {
    it('renders correctly for null', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: null });
      const component = mountComponent();
      const dd = component.first('#submission-basic-details-review-state');
      dd.find('.icon-dot-circle-o').length.should.equal(1);
      dd.text().should.equal('Received');
    });

    it('renders correctly for hasIssues', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
      const component = mountComponent();
      const dd = component.first('#submission-basic-details-review-state');
      dd.find('.icon-comments').length.should.equal(1);
      dd.text().should.equal('Has issues');
    });

    it('renders correctly for edited', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'edited' });
      const component = mountComponent();
      const dd = component.first('#submission-basic-details-review-state');
      dd.find('.icon-pencil').length.should.equal(1);
      dd.text().should.equal('Edited');
    });

    it('renders correctly for approved', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'approved' });
      const component = mountComponent();
      const dd = component.first('#submission-basic-details-review-state');
      dd.find('.icon-check-circle').length.should.equal(1);
      dd.text().should.equal('Approved');
    });

    it('renders correctly for rejected', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'rejected' });
      const component = mountComponent();
      const dd = component.first('#submission-basic-details-review-state');
      dd.find('.icon-times-circle').length.should.equal(1);
      dd.text().should.equal('Rejected');
    });
  });

  describe('device ID', () => {
    it('shows the device ID', () => {
      testData.extendedSubmissions.createPast(1, { deviceId: 'foo' });
      const span = mountComponent().find('dd')[4].first('span');
      span.text().should.equal('foo');
      span.getAttribute('title').should.equal('foo');
    });

    it('does not render if there is not a device ID', () => {
      testData.extendedSubmissions.createPast(1, { deviceId: null });
      mountComponent().find('dd').length.should.equal(4);
    });
  });

  describe('attachments', () => {
    it('shows the attachment counts', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsExpected: 3,
        attachmentsPresent: 2
      });
      const text = mountComponent().find('dd')[4].first('span').text();
      text.should.equal('2 files / 3 expected');
    });

    it('shows an icon if the counts are not equal', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsExpected: 3,
        attachmentsPresent: 2
      });
      const spans = mountComponent().find('dd')[4].find('span');
      spans[1].hasClass('icon-exclamation-triangle').should.be.true();
      spans[2].text().should.equal('Missing media');
    });

    it('does not render if no attachments are expected', () => {
      testData.extendedSubmissions.createPast(1, { attachmentsExpected: 0 });
      mountComponent().find('dd').length.should.equal(4);
    });
  });
});
