import DateTime from '../../../src/components/date-time.vue';
import FormVersionString from '../../../src/components/form-version/string.vue';
import SubmissionBasicDetails from '../../../src/components/submission/basic-details.vue';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = (options = {}) => mount(SubmissionBasicDetails, {
  ...options,
  requestData: {
    submission: testData.submissionOData(),
    submissionVersion: {},
    ...options.requestData
  }
});

describe('SubmissionBasicDetails', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('shows the instance ID', () => {
    testData.extendedSubmissions.createPast(1, { instanceId: 'foo' });
    const span = mountComponent().get('dd span');
    span.text().should.equal('foo');
    span.attributes().title.should.equal('foo');
  });

  it('shows the submitter', () => {
    testData.extendedSubmissions.createPast(1, {
      submitter: testData.extendedUsers.first()
    });
    const span = mountComponent().findAll('dd').at(1).get('span');
    span.text().should.equal('Alice');
    span.attributes().title.should.equal('Alice');
  });

  it('shows the submission date', () => {
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    mountComponent().getComponent(DateTime).props().iso.should.equal(createdAt);
  });

  describe('review state', () => {
    it('renders correctly for null', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: null });
      const component = mountComponent();
      const dd = component.get('#submission-basic-details-review-state');
      dd.find('.icon-dot-circle-o').exists().should.be.true();
      dd.text().should.equal('Received');
    });

    it('renders correctly for hasIssues', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
      const component = mountComponent();
      const dd = component.get('#submission-basic-details-review-state');
      dd.find('.icon-comments').exists().should.be.true();
      dd.text().should.equal('Has issues');
    });

    it('renders correctly for edited', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'edited' });
      const component = mountComponent();
      const dd = component.get('#submission-basic-details-review-state');
      dd.find('.icon-pencil').exists().should.be.true();
      dd.text().should.equal('Edited');
    });

    it('renders correctly for approved', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'approved' });
      const component = mountComponent();
      const dd = component.get('#submission-basic-details-review-state');
      dd.find('.icon-check-circle').exists().should.be.true();
      dd.text().should.equal('Approved');
    });

    it('renders correctly for rejected', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'rejected' });
      const component = mountComponent();
      const dd = component.get('#submission-basic-details-review-state');
      dd.find('.icon-times-circle').exists().should.be.true();
      dd.text().should.equal('Rejected');
    });
  });

  it('shows the form version', () => {
    testData.extendedSubmissions.createPast(1);
    const component = mountComponent();
    component.getComponent(FormVersionString).props().version.should.equal('v1');
  });

  describe('device ID', () => {
    it('shows the device ID', () => {
      testData.extendedSubmissions.createPast(1, { deviceId: 'foo' });
      const span = mountComponent().findAll('dd').at(5).get('span');
      span.text().should.equal('foo');
      span.attributes().title.should.equal('foo');
    });

    it('does not render if there is not a device ID', () => {
      testData.extendedSubmissions.createPast(1, { deviceId: null });
      mountComponent().findAll('dd').length.should.equal(5);
    });
  });

  describe('user agent', () => {
    it('shows the user agent', () => {
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({
        requestData: {
          submissionVersion: { userAgent: 'Collect' }
        }
      });
      const span = component.findAll('dd').at(5).get('span');
      span.text().should.equal('Collect');
      span.attributes().title.should.equal('Collect');
    });

    it('does not render if there is not a user agent', () => {
      testData.extendedSubmissions.createPast(1);
      mountComponent().findAll('dd').length.should.equal(5);
    });
  });

  describe('attachments', () => {
    it('shows the attachment counts', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsExpected: 3,
        attachmentsPresent: 2
      });
      const text = mountComponent().findAll('dd').at(5).get('span').text();
      text.should.equal('2 files / 3 expected');
    });

    it('shows an icon if the counts are not equal', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsExpected: 3,
        attachmentsPresent: 2
      });
      const spans = mountComponent().findAll('dd').at(5).findAll('span');
      spans.at(1).classes('icon-exclamation-triangle').should.be.true();
      spans.at(2).text().should.equal('Missing media');
    });

    it('does not render if no attachments are expected', () => {
      testData.extendedSubmissions.createPast(1, { attachmentsExpected: 0 });
      mountComponent().findAll('dd').length.should.equal(5);
    });
  });
});
