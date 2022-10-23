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
  describe('instanceNameOrId', () => {
    it('returns the instance name if it is string', () => {
      testData.extendedForms.createPast(1, {
        fields: [
          testData.fields.string('/meta/instanceName'),
          testData.fields.string('/s')
        ],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        instanceId: 's',
        meta: { instanceName: 'My Submission' }
      });
      createResource().instanceNameOrId.should.equal('My Submission');
    });

    it('returns the instance ID if there is no instance name', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 's' });
      createResource().instanceNameOrId.should.equal('s');
    });

    it('returns the instance ID if /meta/instanceName is not a string', () => {
      testData.extendedForms.createPast(1, {
        fields: [
          testData.fields.int('/meta/instanceName'),
          testData.fields.string('/s')
        ],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        instanceId: 's',
        meta: { instanceName: 1 }
      });
      createResource().instanceNameOrId.should.equal('s');
    });
  });
});
