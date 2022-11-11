import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';
import useDatasets from '../../../src/request-data/datasets';

describe('DatasetList', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/datasets', {
      root: false,
      container: { requestData: testRequestData([useDatasets]) }
    }).testRequests([
      { url: '/v1/projects/1/datasets' }
    ]);
  });
});
