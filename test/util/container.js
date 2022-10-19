import createContainer from '../../src/container';
import defaultConfig from '../../src/config';

import { mockAxios } from './axios';
import { mockLogger } from './util';
import { testRequestData } from './request-data';

/*
createTestContainer() creates a container with sensible defaults for testing.

You can use the requestData option to set up the requestData object. Pass an
object to specify initial data; the object will be passed to setRequestData().
To set up local resources, pass in the result from testRequestData().
*/
export default ({ requestData, ...options } = {}) => {
  const container = createContainer({
    router: null,
    requestData: typeof requestData === 'function'
      ? requestData
      : testRequestData([], requestData),
    http: mockAxios(),
    logger: mockLogger(),
    ...options,
    config: { ...defaultConfig, ...options.config }
  });
  if (container.requestData.seed != null) container.requestData.seed();
  return container;
};
