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

// Importing setup.js first, because the import statements below may import some
// of the same modules as setup.js, and in some cases, the order in which
// setup.js imports modules matters.
import './setup';

import Vue from 'vue';

import App from './components/app.vue';
import i18n from './i18n';
import router from './router';
import store from './store';

new Vue({ // eslint-disable-line no-new
  el: '#app',
  render: (h) => h(App),
  router,
  store,
  i18n
});
