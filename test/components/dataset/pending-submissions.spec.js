import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetPendingSubmissions', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/datasets', {
      root: false
    }).testRequests([
      { url: '/v1/projects/1/datasets', extended: true }
    ]);
  });
});
