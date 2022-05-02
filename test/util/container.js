import createContainer from '../../src/container';
import defaultConfig from '../../src/config';

import { mockAxios } from './axios';
import { mockLogger } from './util';
import { testStore } from './store';

// Creates a container with sensible defaults for testing.
export default (options = {}) => createContainer({
  router: null,
  store: testStore(options.requestData),
  http: mockAxios(),
  logger: mockLogger(),
  ...options,
  config: { ...defaultConfig, ...options.config }
});
