import useSubmission from '../../src/request-data/submission';

import createTestContainer from '../util/container';
import testData from '../data';
import { testRequestData } from '../util/request-data';

const createResource = () => {
  const { requestData } = createTestContainer({
    requestData: testRequestData([useSubmission], {
      submission: testData.submissionOData()
    })
  });
  return requestData.localResources.submission;
};

describe('useSubmission()', () => {
  describe('instanceName', () => {
    it('returns the instance name if it is string', () => {
      testData.extendedSubmissions.createPast(1, {
        meta: { instanceName: 'My Submission' }
      });
      createResource().instanceName.should.equal('My Submission');
    });

    it('returns nullish if there is no instance name', () => {
      testData.extendedSubmissions.createPast(1);
      should.not.exist(createResource().instanceName);
    });
  });
});
