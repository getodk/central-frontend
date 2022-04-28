import createContainer from '../../src/container';
import defaultConfig from '../../src/config';

import { testStore } from './store';

// Creates a container with sensible defaults for testing.
export default (options = {}) => createContainer({
  router: null,
  store: testStore(options.requestData),
  ...options,
  config: { ...defaultConfig, ...options.config }
});
