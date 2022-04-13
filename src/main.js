/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';

// These files must be imported before the rest.
import './plugins';
import './setup';

import App from './components/app.vue';

import createContainer from './container';
import { $tcn } from './util/i18n';

const container = createContainer();
Vue.use(container);
Vue.prototype.$tcn = $tcn;

new Vue({ // eslint-disable-line no-new
  el: '#app',
  render: (h) => h(App),
  router: container.router,
  store: container.store,
  i18n: container.i18n,
  provide: container.provide
});
