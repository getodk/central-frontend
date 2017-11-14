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
// Global components
import ErrorMessage from './components/error-message.vue';
import ListHeading from './components/list-heading.vue';

Vue.config.productionTip = false;

// TODO: Don't hard-code base URL.
axios.defaults.baseURL = 'http://localhost:8383';

// Register global components.
// https://vuejs.org/v2/guide/components.html#Global-Registration
const globalComponents = [ErrorMessage, ListHeading];
for (const component of globalComponents)
  Vue.component(component.name, component);

new Vue({
  el: '#app',
  render: (h) => h(App)
});
