import DateTime from '../../../src/components/date-time.vue';
import LinkIfCan from '../../../src/components/link-if-can.vue';
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
    const link = mountComponent().first(LinkIfCan);
    link.getProp('to').should.equal('/users/1/edit');
    link.text().trim().should.equal('Alice');
    link.getAttribute('title').should.equal('Alice');
  });

  it('shows the submission date', () => {
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    mountComponent().first(DateTime).getProp('iso').should.equal(createdAt);
  });

  describe('device ID', () => {
    it('shows the device ID', () => {
      testData.extendedSubmissions.createPast(1, { deviceId: 'foo' });
      const span = mountComponent().find('dd')[3].first('span');
      span.text().should.equal('foo');
      span.getAttribute('title').should.equal('foo');
    });

    it('does not render if there is not a device ID', () => {
      testData.extendedSubmissions.createPast(1, { deviceId: null });
      mountComponent().find('dd').length.should.equal(3);
    });
  });

  describe('attachments', () => {
    it('shows the attachment counts', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsExpected: 3,
        attachmentsPresent: 2
      });
      const text = mountComponent().find('dd')[3].first('span').text();
      text.should.equal('2 files / 3 expected');
    });

    it('shows an icon if the counts are not equal', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsExpected: 3,
        attachmentsPresent: 2
      });
      const spans = mountComponent().find('dd')[3].find('span');
      spans[1].hasClass('icon-exclamation-triangle').should.be.true();
      spans[2].text().should.equal('Missing media');
    });

    it('does not render if no attachments are expected', () => {
      testData.extendedSubmissions.createPast(1, { attachmentsExpected: 0 });
      mountComponent().find('dd').length.should.equal(3);
    });
  });
});
