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

import createCentralI18n from './i18n';
import createCentralRouter from './router';
import createHoverCard from './container/hover-card';
import createUnsavedChanges from './unsaved-changes';
import { $tcn } from './util/i18n';
import { createAlert } from './alert';
import { createRequestData } from './request-data';

const provide = [
  'alert',
  'hoverCard',
  'unsavedChanges',
  'config',
  'http',
  'location',
  'logger'
];

axios.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';

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
  hoverCard = createHoverCard(),
  unsavedChanges = createUnsavedChanges(i18n.global),
  http = axios,
  location = window.location,
  // Adding `logger` in part in order to silence certain logging during testing.
  logger = console,
  buildMode = import.meta.env?.MODE ?? 'production'
} = {}) => {
  const container = {
    i18n: i18n.global,
    alert,
    hoverCard,
    unsavedChanges,
    http,
    location,
    logger,
    buildMode
  };
  container.requestData = requestData(container);
  container.config = container.requestData.config;
  if (router != null) container.router = router(container);
  container.install = (app) => {
    app.use(i18n);
    // Register <i18n-t>, since we specify VueI18nPlugin({ fullInstall: false })
    // in vite.config.js. Testing works a little differently: see karma.conf.js.
    if (buildMode !== 'test') app.component(Translation.name, Translation);
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$tcn = $tcn;

    app.use(container.requestData);
    if (container.router != null) app.use(container.router);

    app.provide('container', container);
    for (const key of provide)
      app.provide(key, container[key]);
  };
  return container;
};
