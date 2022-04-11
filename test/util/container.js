import createContainer from '../../src/container';

import { setData } from './store';

export default (options = {}) => {
  const container = createContainer({
    router: null,
    ...options
  });
  if (options.requestData != null) setData(options.requestData);
  return container;
};
