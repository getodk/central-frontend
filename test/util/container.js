import createContainer from '../../src/container';
import defaultConfig from '../../src/config';

import { setData } from './store';

// Creates a container with sensible defaults for testing.
export default (options = {}) => {
  const container = createContainer({
    router: null,
    ...options,
    config: { ...defaultConfig, ...options.config }
  });
  if (options.requestData != null) setData(options.requestData);
  return container;
};
