import { instanceNameOrId } from '../../src/util/odata';

import testData from '../data';

describe('util/odata', () => {
  describe('instanceNameOrId()', () => {
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
      const submission = testData.submissionOData().value[0];
      instanceNameOrId(submission).should.equal('My Submission');
    });

    it('returns the instance ID if there is no instance name', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 's' });
      instanceNameOrId(testData.submissionOData().value[0]).should.equal('s');
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
      instanceNameOrId(testData.submissionOData().value[0]).should.equal('s');
    });
  });
});
