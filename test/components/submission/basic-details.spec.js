import DateTime from '../../../src/components/date-time.vue';
import FormVersionString from '../../../src/components/form-version/string.vue';
import SubmissionBasicDetails from '../../../src/components/submission/basic-details.vue';
import SubmissionReviewState from '../../../src/components/submission/review-state.vue';

import useSubmission from '../../../src/request-data/submission';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(SubmissionBasicDetails, mergeMountOptions(options, {
    container: {
      requestData: testRequestData([useSubmission], {
        submission: testData.submissionOData(),
        submissionVersion: {}
      })
    }
  }));

describe('SubmissionBasicDetails', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice Allison' });
  });

  it('shows the instance ID', async () => {
    testData.extendedSubmissions.createPast(1, { instanceId: 'foobar' });
    const span = mountComponent().get('dd span');
    span.text().should.equal('foobar');
    await span.should.have.textTooltip();
  });

  it('shows the submitter', async () => {
    testData.extendedSubmissions.createPast(1, {
      submitter: testData.extendedUsers.first()
    });
    const span = mountComponent().get('dl :nth-child(2) dd span');
    span.text().should.equal('Alice Allison');
    await span.should.have.textTooltip();
  });

  it('shows the submission date', () => {
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    mountComponent().getComponent(DateTime).props().iso.should.equal(createdAt);
  });

  it('shows the review state', () => {
    testData.extendedSubmissions.createPast(1, { reviewState: 'approved' });
    const component = mountComponent();
    const { value } = component.getComponent(SubmissionReviewState).props();
    value.should.equal('approved');
  });

  it('shows the form version', () => {
    testData.extendedSubmissions.createPast(1);
    const component = mountComponent();
    component.getComponent(FormVersionString).props().version.should.equal('v1');
  });

  describe('device ID', () => {
    it('shows the device ID', async () => {
      testData.extendedSubmissions.createPast(1, { deviceId: 'foobar' });
      const span = mountComponent().get('dl :nth-child(6) dd span');
      span.text().should.equal('foobar');
      await span.should.have.textTooltip();
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
        container: {
          requestData: {
            submissionVersion: { userAgent: 'Collect' }
          }
        }
      });
      component.get('dl :nth-child(6) dd').text().should.equal('Collect');
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
      const text = mountComponent().get('dl :nth-child(6) dd span').text();
      text.should.equal('2 files / 3 expected');
    });

    it('shows an icon if the counts are not equal', () => {
      testData.extendedSubmissions.createPast(1, {
        attachmentsExpected: 3,
        attachmentsPresent: 2
      });
      const spans = mountComponent().findAll('dl :nth-child(6) dd span');
      spans.length.should.equal(3);
      spans[1].classes('icon-exclamation-triangle').should.be.true;
      spans[2].text().should.equal('Missing Attachment');
    });

    it('does not render if no attachments are expected', () => {
      testData.extendedSubmissions.createPast(1, { attachmentsExpected: 0 });
      mountComponent().findAll('dd').length.should.equal(5);
    });
  });
});
