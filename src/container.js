/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import axios from 'axios';

import createAlert from './alert';
import createCentralI18n from './i18n';
import createCentralRouter from './router';
import createRequestData from './request-data';
import createUnsavedChanges from './unsaved-changes';
import definePresenters from './presenters';
import staticConfigFile from '../config';

export default ({
  // `router` can be an object, or it can be a function that takes a partial
  // container and returns an object. It is also possible to create a container
  // without a router by specifying `null`.
  router = createCentralRouter,
  i18n = createCentralI18n(),
  // requestData should be a function that takes a partial container and returns
  // a requestData object.
  requestData = createRequestData,
  alert = createAlert(),
  unsavedChanges = createUnsavedChanges(),
  staticConfig = staticConfigFile,
  http = axios,
  logger = console
} = {}) => {
  const container = {
    i18n: i18n.global,
    alert,
    unsavedChanges,
    staticConfig,
    http,
    // Adding `logger` in order to silence certain logging during testing.
    logger
  };
  Object.assign(container, definePresenters(container));
  container.requestData = requestData(container);
  if (router != null)
    container.router = typeof router === 'function' ? router(container) : router;
  container.install = (app) => {
    app
      .use(i18n)
      .use(container.router)
      .provide('container', container)
      .provide('requestData', requestData)
      .provide('alert', alert)
      .provide('unsavedChanges', unsavedChanges)
      .provide('staticConfig', staticConfig)
      .provide('http', http)
      .provide('logger', logger);
  };
  return container;
};