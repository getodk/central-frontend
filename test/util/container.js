import createContainer from '../../src/container';

import { setData } from './store';

export default (options = {}) => {
  const container = createContainer({
    router: null,
    ...options
  });
  if (options.requestData != null) setData(options.requestData);
  const { install } = container;
  container.install = (Vue) => {
    install.call(container, Vue);
    // eslint-disable-next-line no-param-reassign
    Vue.prototype.$container = container;
  };
  return container;
};
