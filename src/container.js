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
import { Translation } from 'vue-i18n';
import { createPinia } from 'pinia';

import createAlert from './alert';
import createCentralI18n from './i18n';
import createCentralRouter from './router';
import createUnsavedChanges from './unsaved-changes';
import defaultConfig from './config';
import { createRequestData } from './request-data';
import { noop } from './util/util';

const provide = [
  'alert',
  'unsavedChanges',
  'config',
  'http',
  'logger'
];

const piniaMock = { install: noop };

export default ({
  // `router` must be a function that returns an object. The function will be
  // passed a partial container. It is also possible to create a container
  // without a router by specifying `null` (the default in testing).
  router = createCentralRouter,
  i18n = createCentralI18n(),
  // requestData must be a function that returns an object. The function will be
  // passed a partial container.
  requestData = createRequestData,
  alert = createAlert(),
  unsavedChanges = createUnsavedChanges(i18n.global),
  config = defaultConfig,
  http = axios,
  // Adding `logger` in part in order to silence certain logging during testing.
  logger = console
} = {}) => {
  const container = {
    pinia: process.env.NODE_ENV === 'development' ? createPinia() : piniaMock,
    i18n: i18n.global,
    alert,
    unsavedChanges,
    config,
    http,
    logger
  };
  container.requestData = requestData(container);
  if (router != null) container.router = router(container);
  container.install = (app) => {
    // Register <i18n-t>, since we specify `false` for the fullInstall option of
    // vue-cli-plugin-i18n.
    app.use(i18n).component(Translation.name, Translation);
    app.use(container.pinia);
    app.use(container.requestData);
    if (container.router != null) app.use(container.router);

    app.provide('container', container);
    for (const key of provide)
      app.provide(key, container[key]);
  };
  return container;
};
