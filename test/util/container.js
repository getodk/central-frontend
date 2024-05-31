import createContainer from '../../src/container';

import { mockAxios } from './axios';
import { mockLogger } from './util';
import { testRequestData } from './request-data';

/*
createTestContainer() creates a container with sensible defaults for testing.

- You can use the requestData option to set up the requestData object. Pass an
  object to specify initial data; the object will be passed to setRequestData().
  To set up local resources, pass in the result from testRequestData().
- The config is set by default, preventing a request for the config during the
  initial navigation. To not set the config, specify `false`. You can also set
  the config with values different from the default.
*/
export default ({ requestData, config = {}, ...options } = {}) => {
  const container = createContainer({
    router: null,
    requestData: typeof requestData === 'function'
      ? requestData
      : testRequestData([], requestData),
    http: mockAxios(),
    logger: mockLogger(),
    ...options
  });
  if (config !== false)
    container.requestData.config.setFromResponse({ status: 200, data: config });
  if (container.requestData.seed != null) container.requestData.seed();
  return container;
};
