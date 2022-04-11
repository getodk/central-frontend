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
import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

import i18n from './i18n';
import router from './router';
import store from './store';
import { StoreAlert } from './util/alert';

export default (options = {}) => {
  const container = {
    store,
    i18n
  };
  const { router: routerOption = router } = options;
  if (routerOption != null) container.router = routerOption;
  container.install = (Vue) => {
    Vue.use(Vuex);
    Vue.use(VueI18n);
    if (routerOption != null && routerOption instanceof VueRouter)
      Vue.use(VueRouter);
    // eslint-disable-next-line no-param-reassign
    Vue.prototype.$alert = function $alert() {
      return new StoreAlert(this.$store);
    };
  };
  container.provide = {
    container
  };
  return container;
};
