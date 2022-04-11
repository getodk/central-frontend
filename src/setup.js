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

// This file completes setup common to production/development and testing. The
// order in which it is imported is important. It can only be imported after
// plugins have been installed. It should also be imported before other files,
// because this file has side effects.

import Vue from 'vue';
import axios from 'axios';

// ./jquery must be imported before any of Bootstrap's JavaScript plugins,
// because the plugins require jQuery.
import './jquery';
import './bootstrap';

// Import global styles. These must be imported before any component so that
// they precede components' styles.
import './assets/css/bootstrap.css';
import './assets/css/icomoon.css';
import './assets/scss/app.scss';

// Adding $http in order to mock it during testing.
Vue.prototype.$http = axios;
// Adding $logger makes it easier to silence certain logging during testing.
Vue.prototype.$logger = console;
