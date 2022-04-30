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
import VueCompositionAPI from '@vue/composition-api';
import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

import Translation from './components/i18n-t';

import createAlert from './alert';
import createCentralI18n from './i18n';
import createCentralRouter from './router';
import createCentralStore from './store';
import createUnsavedChanges from './unsaved-changes';
import defaultConfig from './config';
import subclassPresenters from './presenters';

export default ({
  // `router` must be a function that returns an object. The function will be
  // passed a partial container. It is also possible to create a container
  // without a router by specifying `null`.
  router = createCentralRouter,
  // `store` must be a function that returns an object. The function will be
  // passed a partial container.
  store = createCentralStore,
  i18n = createCentralI18n(),
  alert = createAlert(),
  unsavedChanges = createUnsavedChanges(i18n),
  config = defaultConfig
} = {}) => {
  const container = {
    i18n,
    alert,
    unsavedChanges,
    config,
    ...subclassPresenters(i18n)
  };
  container.store = store(container);
  if (router != null) container.router = router(container);
  container.install = (Vue) => {
    Vue.use(VueCompositionAPI);
    Vue.use(Vuex);
    Vue.use(VueI18n);
    if (container.router != null)
      Vue.use(container.router instanceof VueRouter ? VueRouter : container.router);
    Vue.component('i18n-t', Translation);
  };
  container.provide = {
    container,
    alert,
    unsavedChanges,
    config
  };
  return container;
};
