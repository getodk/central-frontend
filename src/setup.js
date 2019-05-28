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
import axios from 'axios';
import pluralize from 'pluralize';

import './plugins';
// Import the global styles before importing components.
import './assets/css/bootstrap.css';
import './assets/css/icomoon.css';
import GlobalComponents from './global-components';
import { StoreAlert, uniqueSequence } from './util/util';
// ./jquery must be imported before ./bootstrap, as Bootstrap's JavaScript
// requires jQuery.
import './jquery';
import './bootstrap';

Vue.config.productionTip = false;
GlobalComponents.register();

// Utilities
// https://vuejs.org/v2/cookbook/adding-instance-properties.html
Vue.prototype.$alert = function $alert() {
  return new StoreAlert(this.$store);
};
Vue.prototype.$http = axios;
// Adding $logger makes it easier to silence certain logging during testing.
Vue.prototype.$logger = console;
Vue.prototype.$pluralize = (word, count, inclusive = false) => (!inclusive
  ? pluralize(word, count)
  : `${count.toLocaleString()} ${pluralize(word, count)}`);
Vue.prototype.$uniqueId = uniqueSequence();
