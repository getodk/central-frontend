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

    it('returns null if there is no instance name', () => {
      testData.extendedSubmissions.createPast(1);
      expect(createResource().instanceName).to.be.null;
    });

    it('returns null if /meta/instanceName is not a string', () => {
      testData.extendedForms.createPast(1, {
        fields: [
          testData.fields.group('/meta'),
          testData.fields.int('/meta/instanceName'),
          testData.fields.string('/s')
        ],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        meta: { instanceName: 1 }
      });
      expect(createResource().instanceName).to.be.null;
    });
  });
});
