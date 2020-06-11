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
import './plugins';

// ./jquery must be imported before ./bootstrap, as Bootstrap's JavaScript
// requires jQuery.
import './jquery';
import './bootstrap';

// Import global styles.
import './assets/css/bootstrap.css';
import './assets/css/icomoon.css';
// vue-flatpickr-component requires flatpickr, so I think ESLint is just
// confused here?
// eslint-disable-next-line import/no-extraneous-dependencies
import 'flatpickr/dist/flatpickr.css';
import './assets/scss/app.scss';

import axios from 'axios';

import { StoreAlert } from './util/alert';
import { $tcPath, $tcn } from './util/i18n';
import { uniqueSequence } from './util/util';



////////////////////////////////////////////////////////////////////////////////
// VUE CONFIG

Vue.config.productionTip = false;



////////////////////////////////////////////////////////////////////////////////
// GLOBAL UTILITIES

// See: https://vuejs.org/v2/cookbook/adding-instance-properties.html

Vue.prototype.$alert = function $alert() {
  return new StoreAlert(this.$store);
};
// Adding $http in order to mock it during testing.
Vue.prototype.$http = axios;
// Adding $logger makes it easier to silence certain logging during testing.
Vue.prototype.$logger = console;
Vue.prototype.$uniqueId = uniqueSequence();

// i18n
Vue.prototype.$tcn = $tcn;
Vue.prototype.$tcPath = $tcPath;
