import createContainer from '../../src/container';
import { noop } from '../../src/util/util';

import { testRequestData } from './request-data';

const silentLogger = { log: noop, error: noop };

export default (options = undefined) => {
  const fullOptions = {
    router: null,
    logger: silentLogger,
    ...options
  };
  if (typeof options.requestData !== 'function')
    fullOptions.requestData = testRequestData(options.requestData);
  const container = createContainer(fullOptions);

  const { install } = container;
  container.install = (app) => {
    install.call(container, app);
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$container = container;
  };

  return container;
};
