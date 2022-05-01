import createContainer from '../../src/container';
import defaultConfig from '../../src/config';

import { mockLogger } from './util';
import { testStore } from './store';

// Creates a container with sensible defaults for testing.
export default (options = {}) => createContainer({
  router: null,
  store: testStore(options.requestData),
  logger: mockLogger(),
  ...options,
  config: { ...defaultConfig, ...options.config }
});
