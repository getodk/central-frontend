/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';

// Importing setup.js first, because other import statements below may import
// some of the same modules as setup.js, and in some cases, the order in which
// setup.js imports modules matters.
import './setup';
import App from './components/app.vue';
import store from './store';
import { router } from './router';

new Vue({ // eslint-disable-line no-new
  el: '#app',
  render: (h) => h(App),
  router,
  store
});
