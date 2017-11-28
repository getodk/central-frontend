/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';
import axios from 'axios';

import App from './components/app.vue';
import GlobalComponents from './global-components';
import router from './router';

// TODO: Don't hard-code base URL.
axios.defaults.baseURL = 'http://localhost:8383';

Vue.config.productionTip = false;
GlobalComponents.register();

new Vue({ // eslint-disable-line no-new
  el: '#app',
  render: (h) => h(App),
  router
});
