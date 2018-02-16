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
import VueRouter from 'vue-router';
import axios from 'axios';

import GlobalComponents from './global-components';
import { logOut } from './session';
import { uniqueSequence } from './util';
import './jquery';
import './bootstrap';

axios.defaults.baseURL = '/api/v1';

Vue.use(VueRouter);
Vue.config.productionTip = false;
GlobalComponents.register();

// Utilities
// https://vuejs.org/v2/cookbook/adding-instance-properties.html
Vue.prototype.$logger = console;
Vue.prototype.$uniqueId = uniqueSequence();
Vue.prototype.$http = axios;

// Global state
// The following prototype properties store global state. Components can set
// these properties using `this`, rather than directly accessing the prototype.
// For example, `this.$alert = ...` from within a component sets the $alert
// prototype property.
const STATE_PROPERTIES = ['session', 'alert'];
for (const name of STATE_PROPERTIES) {
  const $name = `$${name}`;
  const $_name = `$_${name}`; // eslint-disable-line camelcase
  Object.defineProperty(Vue.prototype, $name, {
    get() { return Vue.prototype[$_name]; },
    set(value) { Vue.prototype[$_name] = value; }
  });
}
logOut();
Vue.prototype.$alert = null;
